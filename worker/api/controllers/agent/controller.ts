import { WebSocketMessageResponses } from '../../../agents/constants';
import { BaseController } from '../baseController';
import { generateId } from '../../../utils/idGenerator';
import { CodeGenState } from '../../../agents/core/state';
import { getAgentStub, getTemplateForQuery } from '../../../agents';
import { AgentConnectionData, AgentPreviewResponse, CodeGenArgs } from './types';
import { ApiResponse, ControllerResponse } from '../types';
import { RouteContext } from '../../types/route-context';
import { ModelConfigService, AppService } from '../../../database';
import { ModelConfig } from '../../../agents/inferutils/config.types';
import { validateWebSocketOrigin } from '../../../middleware/security/websocket';
import { createLogger } from '../../../logger';
import { getPreviewDomain } from 'worker/utils/urls';
import { ImageType, uploadImage } from 'worker/utils/images';
import { ProcessedImageAttachment } from 'worker/types/image-attachment';
import { getTemplateImportantFiles } from 'worker/services/sandbox/utils';

const defaultCodeGenArgs: CodeGenArgs = {
    query: '',
    language: 'typescript',
    frameworks: ['react', 'vite'],
    selectedTemplate: 'auto',
    agentMode: 'deterministic',
};


/**
 * CodingAgentController to handle all code generation related endpoints
 */
export class CodingAgentController extends BaseController {
    static logger = createLogger('CodingAgentController');
    /**
     * Start the incremental code generation process
     */
    static async startCodeGeneration(request: Request, env: Env, _: ExecutionContext, context: RouteContext): Promise<Response> {
        try {
            this.logger.info('Starting code generation process');

            const url = new URL(request.url);
            const hostname = url.hostname === 'localhost' ? `localhost:${url.port}`: getPreviewDomain(env);

            // Preflight: ensure required AI credentials exist (OpenAI-only configuration)
            const openaiKey = (env as any).OPENAI_API_KEY as string | undefined;
            if (!openaiKey || typeof openaiKey !== 'string' || openaiKey.trim().length < 10) {
                return CodingAgentController.createErrorResponse(
                    'OPENAI_API_KEY is missing. Set it in .dev.vars for local dev or as a Wrangler secret for deployments.',
                    400
                );
            }

            // Parse the query from the request body
            let body: CodeGenArgs;
            try {
                body = await request.json() as CodeGenArgs;
            } catch (error) {
                return CodingAgentController.createErrorResponse(`Invalid JSON in request body: ${JSON.stringify(error, null, 2)}`, 400);
            }

            const query = body.query;
            if (!query) {
                return CodingAgentController.createErrorResponse('Missing "query" field in request body', 400);
            }
            const { readable, writable } = new TransformStream({
                transform(chunk, controller) {
                    if (chunk === "terminate") {
                        controller.terminate();
                    } else {
                        const encoded = new TextEncoder().encode(JSON.stringify(chunk) + '\n');
                        controller.enqueue(encoded);
                    }
                }
            });
            const writer = writable.getWriter();
            // Check if user is authenticated (required for app creation)
            const user = context.user!;
            // App creation rate limits disabled

            // Credit check & consumption (1 credit per generation) - non-fatal on DB issues
            try {
                const { CreditService } = await import('../../../database/services/CreditService');
                const { COSTS } = await import('../../../config/pricing');
                const creditService = new CreditService(env);
                await creditService.ensureCreditsUpToDate(user.id);
                const cost = COSTS.startGeneration ?? 1;
                const consume = await creditService.consumeCredits(user.id, cost);
                if (!consume.ok) {
                    return CodingAgentController.createErrorResponse(
                        new Error('Insufficient credits. Please upgrade your plan.'),
                        402
                    );
                }
            } catch (e) {
                // Log and continue (likely D1 not ready); do not block code generation
                CodingAgentController.logger.warn('Credit system unavailable, skipping credit enforcement', e);
            }

            const agentId = generateId();
            const modelConfigService = new ModelConfigService(env);

            // Fetch user model configs safely (fallback to defaults if DB not available)
            let userConfigsRecord: Record<string, any> = {};
            let agentInstance: any;
            try {
                const results = await Promise.all([
                    modelConfigService.getUserModelConfigs(user.id).catch((e) => {
                        CodingAgentController.logger.warn('ModelConfigService unavailable, using defaults', e);
                        return {} as Record<string, any>;
                    }),
                    getAgentStub(env, agentId),
                ]);
                userConfigsRecord = results[0] || {};
                agentInstance = results[1] as any;
            } catch (e) {
                // If agent fetch worked but configs failed unexpectedly, keep going with empty overrides
                CodingAgentController.logger.warn('Proceeding without user model config overrides', e);
                agentInstance = await getAgentStub(env, agentId);
            }

            // Convert Record to Map and extract only ModelConfig properties
            const userModelConfigs = new Map();
            for (const [actionKey, mergedConfig] of Object.entries(userConfigsRecord)) {
                if ((mergedConfig as any).isUserOverride) {
                    const modelConfig: ModelConfig = {
                        name: (mergedConfig as any).name,
                        max_tokens: (mergedConfig as any).max_tokens,
                        temperature: (mergedConfig as any).temperature,
                        reasoning_effort: (mergedConfig as any).reasoning_effort,
                        fallbackModel: (mergedConfig as any).fallbackModel
                    };
                    userModelConfigs.set(actionKey, modelConfig);
                }
            }

            const inferenceContext = {
                userModelConfigs: Object.fromEntries(userModelConfigs),
                agentId: agentId,
                userId: user.id,
                enableRealtimeCodeFix: false, // This costs us too much, so disabled it for now
                enableFastSmartCodeFix: false,
            }
                                
            this.logger.info(`Initialized inference context for user ${user.id}`, {
                modelConfigsCount: Object.keys(userModelConfigs).length,
            });

            const { templateDetails, selection } = await getTemplateForQuery(env, inferenceContext, query, body.images, this.logger);

            let websocketUrl = `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}/api/agent/${agentId}/ws`;
            const httpStatusUrl = `${url.origin}/api/agent/${agentId}`;

            // Issue a short-lived, single-use WS token and append to URL for browser WS auth
            try {
                const { WebSocketTokenService } = await import('../../../services/auth/WebSocketTokenService');
                const wsTokenService = new WebSocketTokenService(env);
                const token = await wsTokenService.issue(context.user!.id, agentId, 90); // 90s TTL
                const u = new URL(websocketUrl);
                u.searchParams.set('token', token);
                websocketUrl = u.toString();
            } catch (tokenErr) {
                CodingAgentController.logger.warn('Failed to issue WS auth token for new session', tokenErr);
            }

            let uploadedImages: ProcessedImageAttachment[] = [];
            if (body.images) {
                uploadedImages = await Promise.all(body.images.map(async (image) => {
                    return uploadImage(env, image, ImageType.UPLOADS);
                }));
            }
        
            writer.write({
                message: 'Code generation started',
                agentId: agentId,
                websocketUrl,
                httpStatusUrl,
                template: {
                    name: templateDetails.name,
                    files: getTemplateImportantFiles(templateDetails),
                }
            });

            // Create placeholder app immediately so the app page can load without 404
            try {
                const appService = new AppService(env);
                await appService.createApp({
                    id: agentId,
                    userId: user.id,
                    sessionToken: null,
                    title: query.substring(0, 100) || 'New App',
                    description: null,
                    originalPrompt: query,
                    finalPrompt: query,
                    framework: null,
                    visibility: 'private',
                    status: 'generating',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deploymentId: null,
                    iconUrl: null,
                    githubRepositoryUrl: null,
                    githubRepositoryVisibility: null,
                    isArchived: 0 as any,
                    isFeatured: 0 as any,
                    version: 1,
                    parentAppId: null,
                    screenshotUrl: null,
                    screenshotCapturedAt: null,
                    lastDeployedAt: null,
                } as any);
            } catch (appErr) {
                CodingAgentController.logger.warn('Failed to pre-create app record; frontend may see 404 until agent saves', appErr);
            }

            const agentPromise = agentInstance.initialize({
                query,
                language: body.language || defaultCodeGenArgs.language,
                frameworks: body.frameworks || defaultCodeGenArgs.frameworks,
                hostname,
                inferenceContext,
                images: uploadedImages,
                onBlueprintChunk: (chunk: string) => {
                    writer.write({chunk});
                },
                templateInfo: { templateDetails, selection },
            }, body.agentMode || defaultCodeGenArgs.agentMode) as Promise<CodeGenState>;
            agentPromise.then(async (_state: CodeGenState) => {
                writer.write("terminate");
                writer.close();
                this.logger.info(`Agent ${agentId} terminated successfully`);
            });

            this.logger.info(`Agent ${agentId} init launched successfully`);
            
            return new Response(readable, {
                status: 200,
                headers: {
                    // Use SSE content-type to ensure Cloudflare disables buffering,
                    // while the payload remains NDJSON lines consumed by the client.
                    'Content-Type': 'text/event-stream; charset=utf-8',
                    // Prevent intermediary caches/proxies from buffering or transforming
                    'Cache-Control': 'no-cache, no-store, must-revalidate, no-transform',
                    'Pragma': 'no-cache',
                    'Connection': 'keep-alive'
                }
            });
        } catch (error) {
            this.logger.error('Error starting code generation', error);
            return CodingAgentController.handleError(error, 'start code generation');
        }
    }

    /**
     * Handle WebSocket connections for code generation
     * This routes the WebSocket connection directly to the Agent
     */
    static async handleWebSocketConnection(
        request: Request,
        env: Env,
        _: ExecutionContext,
        context: RouteContext
    ): Promise<Response> {
        try {
            const chatId = context.pathParams.agentId; // URL param is still agentId for backward compatibility
            if (!chatId) {
                return CodingAgentController.createErrorResponse('Missing agent ID parameter', 400);
            }

            // Ensure the request is a WebSocket upgrade request
            if (request.headers.get('Upgrade') !== 'websocket') {
                return new Response('Expected WebSocket upgrade', { status: 426 });
            }
            
            // Validate WebSocket origin
            if (!validateWebSocketOrigin(request, env)) {
                return new Response('Forbidden: Invalid origin', { status: 403 });
            }

            // Extract user for rate limiting
            const user = context.user!;
            if (!user) {
                return CodingAgentController.createErrorResponse('Missing user', 401);
            }

            this.logger.info(`WebSocket connection request for chat: ${chatId}`);
            
            // Log request details for debugging
            const headers: Record<string, string> = {};
            request.headers.forEach((value, key) => {
                headers[key] = value;
            });
            this.logger.info('WebSocket request details', {
                headers,
                url: request.url,
                chatId
            });

            try {
                // Get the agent instance to handle the WebSocket connection
                const agentInstance = await getAgentStub(env, chatId);
                
                this.logger.info(`Successfully got agent instance for chat: ${chatId}`);

                // Let the agent handle the WebSocket connection directly
                return agentInstance.fetch(request);
            } catch (error) {
                this.logger.error(`Failed to get agent instance with ID ${chatId}:`, error);
                // Return an appropriate WebSocket error response
                // We need to emulate a WebSocket response even for errors
                const { 0: client, 1: server } = new WebSocketPair();

                server.accept();
                server.send(JSON.stringify({
                    type: WebSocketMessageResponses.ERROR,
                    error: `Failed to get agent instance: ${error instanceof Error ? error.message : String(error)}`
                }));

                server.close(1011, 'Agent instance not found');

                return new Response(null, {
                    status: 101,
                    webSocket: client
                });
            }
        } catch (error) {
            this.logger.error('Error handling WebSocket connection', error);
            return CodingAgentController.handleError(error, 'handle WebSocket connection');
        }
    }

    /**
     * Connect to an existing agent instance
     * Returns connection information for an already created agent
     */
    static async connectToExistingAgent(
        request: Request,
        env: Env,
        _: ExecutionContext,
        context: RouteContext
    ): Promise<ControllerResponse<ApiResponse<AgentConnectionData>>> {
        try {
            const agentId = context.pathParams.agentId;
            if (!agentId) {
                return CodingAgentController.createErrorResponse<AgentConnectionData>('Missing agent ID parameter', 400);
            }

            this.logger.info(`Connecting to existing agent: ${agentId}`);

            try {
                // Verify the agent instance exists
                const agentInstance = await getAgentStub(env, agentId);
                if (!agentInstance || !(await agentInstance.isInitialized())) {
                    return CodingAgentController.createErrorResponse<AgentConnectionData>('Agent instance not found or not initialized', 404);
                }
                this.logger.info(`Successfully connected to existing agent: ${agentId}`);

                // Construct WebSocket URL
                const url = new URL(request.url);
                let websocketUrl = `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}/api/agent/${agentId}/ws`;

                // Issue a short-lived, single-use token for WS auth and append as query param
                try {
                    const { WebSocketTokenService } = await import('../../../services/auth/WebSocketTokenService');
                    const wsTokenService = new WebSocketTokenService(env);
                    const userId = context.user!.id;
                    const token = await wsTokenService.issue(userId, agentId, 90); // 90s TTL
                    const u = new URL(websocketUrl);
                    u.searchParams.set('token', token);
                    websocketUrl = u.toString();
                } catch (tokenErr) {
                    CodingAgentController.logger.warn('Failed to issue WS auth token, proceeding without it', tokenErr);
                }

                const responseData: AgentConnectionData = {
                    websocketUrl,
                    agentId,
                };

                return CodingAgentController.createSuccessResponse(responseData);
            } catch (error) {
                this.logger.error(`Failed to connect to agent ${agentId}:`, error);
                return CodingAgentController.createErrorResponse<AgentConnectionData>(`Agent instance not found or unavailable: ${error instanceof Error ? error.message : String(error)}`, 404);
            }
        } catch (error) {
            this.logger.error('Error connecting to existing agent', error);
            return CodingAgentController.handleError(error, 'connect to existing agent') as ControllerResponse<ApiResponse<AgentConnectionData>>;
        }
    }

    static async deployPreview(
        _request: Request,
        env: Env,
        _: ExecutionContext,
        context: RouteContext
    ): Promise<ControllerResponse<ApiResponse<AgentPreviewResponse>>> {
        try {
            const agentId = context.pathParams.agentId;
            if (!agentId) {
                return CodingAgentController.createErrorResponse<AgentPreviewResponse>('Missing agent ID parameter', 400);
            }

            this.logger.info(`Deploying preview for agent: ${agentId}`);

            try {
                // Get the agent instance
                const agentInstance = await getAgentStub(env, agentId);
                
                // Deploy the preview
                const preview = await agentInstance.deployToSandbox();
                if (!preview) {
                    return CodingAgentController.createErrorResponse<AgentPreviewResponse>('Failed to deploy preview', 500);
                }
                this.logger.info('Preview deployed successfully', {
                    agentId,
                    previewUrl: preview.previewURL
                });

                return CodingAgentController.createSuccessResponse(preview);
            } catch (error) {
                this.logger.error('Failed to deploy preview', { agentId, error });
                return CodingAgentController.createErrorResponse<AgentPreviewResponse>('Failed to deploy preview', 500);
            }
        } catch (error) {
            this.logger.error('Error deploying preview', error);
            const appError = CodingAgentController.handleError(error, 'deploy preview') as ControllerResponse<ApiResponse<AgentPreviewResponse>>;
            return appError;
        }
    }
}