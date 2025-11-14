
import { BaseController } from '../baseController';
import { ApiResponse, ControllerResponse } from '../types';
import type { RouteContext } from '../../types/route-context';
import { getAgentStubLightweight, getAgentState } from '../../../agents';
import { AppService } from '../../../database/services/AppService';
import { 
    AppDetailsData, 
    AppStarToggleData,
    GitCloneTokenData,
} from './types';
import { AgentSummary } from '../../../agents/core/types';
import { createLogger } from '../../../logger';
import { buildUserWorkerUrl, buildGitCloneUrl } from 'worker/utils/urls';
import { JWTUtils } from '../../../utils/jwtUtils';

export class AppViewController extends BaseController {
    static logger = createLogger('AppViewController');
    
    // Get single app details (public endpoint, auth optional for ownership check)
    static async getAppDetails(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<AppDetailsData>>> {
        try {
            const appId = context.pathParams.id;
            if (!appId) {
                return AppViewController.createErrorResponse<AppDetailsData>('App ID is required', 400);
            }
            
            // Try to get user if authenticated (optional for public endpoint)
            const user = await AppViewController.getOptionalUser(request, env);
            const userId = user?.id;

            // Get app details with stats using app service
            const appService = new AppService(env);
            let appResult = await appService.getAppDetails(appId, userId);

            if (!appResult) {
                // Fallback: try to reconstruct missing app row from agent state if the Durable Object exists
                try {
                    const agentState = await getAgentState(env, appId);
                    const ownerId = agentState.inferenceContext.userId;

                    if (!ownerId) {
                        this.logger.warn('Agent state found but missing owner userId when reconstructing app', { appId });
                        return AppViewController.createErrorResponse<AppDetailsData>('App not found', 404);
                    }

                    this.logger.info('Reconstructing missing app from agent state', {
                        appId,
                        ownerId,
                    });

                    await appService.createApp({
                        id: appId,
                        userId: ownerId,
                        sessionToken: null,
                        title: agentState.blueprint?.title || agentState.query?.substring(0, 100) || 'New App',
                        description: agentState.blueprint?.description || null,
                        originalPrompt: agentState.query || '',
                        finalPrompt: agentState.query || '',
                        framework: agentState.blueprint?.frameworks?.[0],
                        visibility: 'private',
                        status: 'generating',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    // Re-fetch using standard path to include analytics/statistics
                    appResult = await appService.getAppDetails(appId, userId);

                    if (!appResult) {
                        this.logger.error('Reconstructed app but getAppDetails still returned null', { appId, ownerId });
                        return AppViewController.createErrorResponse<AppDetailsData>('App not found', 404);
                    }
                } catch (reconstructError) {
                    this.logger.error('Failed to reconstruct app from agent state', {
                        appId,
                        error: reconstructError,
                    });
                    return AppViewController.createErrorResponse<AppDetailsData>('App not found', 404);
                }
            }

            // Check if user has permission to view
            if (appResult.visibility === 'private' && appResult.userId !== userId) {
                return AppViewController.createErrorResponse<AppDetailsData>('App not found', 404);
            }

            // Track view for all users (including owners and anonymous users)
            if (userId) {
                // Authenticated user view
                await appService.recordAppView(appId, userId);
            } else {
                // Anonymous user view - use a special anonymous identifier
                // This could be enhanced with session tracking or IP-based deduplication
                await appService.recordAppView(appId, 'anonymous-' + Date.now());
            }

            // Try to fetch current agent state to get latest generated code
            let agentSummary: AgentSummary | null = null;
            let previewUrl: string = '';
            
            try {
                // Use lightweight stub for read-only operations (faster - skips template loading)
                const agentStub = await getAgentStubLightweight(env, appResult.id);
                agentSummary = await agentStub.getSummary();

                previewUrl = await agentStub.getPreviewUrlCache();
            } catch (agentError) {
                // If agent doesn't exist or error occurred, fall back to database stored files
                this.logger.warn('Could not fetch agent state, using stored files:', agentError);
            }

            const cloudflareUrl = appResult.deploymentId ? buildUserWorkerUrl(env, appResult.deploymentId) : '';

            const responseData: AppDetailsData = {
                ...appResult, // Spread all EnhancedAppData fields including stats
                cloudflareUrl: cloudflareUrl,
                previewUrl: previewUrl || cloudflareUrl,
                user: {
                    id: appResult.userId!,
                    displayName: appResult.userName || 'Unknown',
                    avatarUrl: appResult.userAvatar
                },
                agentSummary,
            };

            return AppViewController.createSuccessResponse(responseData);
        } catch (error) {
            this.logger.error('Error fetching app details:', error);
            return AppViewController.createErrorResponse<AppDetailsData>('Internal server error', 500);
        }
    }

    // Star/unstar an app
    static async toggleAppStar(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<AppStarToggleData>>> {
        try {
            const user = context.user!;

            const appId = context.pathParams.id;
            if (!appId) {
                return AppViewController.createErrorResponse<AppStarToggleData>('App ID is required', 400);
            }

            // Check if app exists and toggle star using app service
            const appService = new AppService(env);
            const app = await appService.getSingleAppWithFavoriteStatus(appId, user.id);
            if (!app) {
                return AppViewController.createErrorResponse<AppStarToggleData>('App not found', 404);
            }

            // Toggle star using app service
            const result = await appService.toggleAppStar(user.id, appId);
            
            const responseData: AppStarToggleData = result;
            return AppViewController.createSuccessResponse(responseData);
        } catch (error) {
            this.logger.error('Error toggling star:', error);
            return AppViewController.createErrorResponse<AppStarToggleData>('Internal server error', 500);
        }
    }

    // // Fork an app
    // DISABLED: Has been disabled for initial alpha release, for security reasons
    // static async forkApp(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ForkAppData>>> {
    //     try {
    //         const user = context.user!;

    //         const appId = context.pathParams.id;
    //         if (!appId) {
    //             return AppViewController.createErrorResponse<ForkAppData>('App ID is required', 400);
    //         }

    //         // Get original app with permission checks using app service
    //         const appService = new AppService(env);
    //         const { app: originalApp, canFork } = await appService.getAppForFork(appId, user.id);

    //         if (!originalApp) {
    //             return AppViewController.createErrorResponse<ForkAppData>('App not found', 404);
    //         }

    //         if (!canFork) {
    //             return AppViewController.createErrorResponse<ForkAppData>('App not found', 404);
    //         }

    //         // Duplicate agent state first
    //         try {
    //             const { newAgentId } = await cloneAgent(env, appId, this.logger);
    //             this.logger.info(`Successfully duplicated agent state from ${appId} to ${newAgentId}`);

    //             // Create forked app using app service
    //             const forkedApp = await appService.createForkedApp(originalApp, newAgentId, user.id);
                
    //             const responseData: ForkAppData = {
    //                 forkedAppId: forkedApp.id,
    //                 message: 'App forked successfully'
    //             };

    //             return AppViewController.createSuccessResponse(responseData);
    //         } catch (error) {
    //             this.logger.error('Failed to duplicate agent state:', error);
    //             return AppViewController.createErrorResponse<ForkAppData>('Failed to duplicate agent state', 500);
    //         }
    //     } catch (error) {
    //         this.logger.error('Error forking app:', error);
    //         return AppViewController.createErrorResponse<ForkAppData>('Internal server error', 500);
    //     }
    // }

    /**
     * Generate short-lived token for git clone (private repos only)
     * POST /api/apps/:id/git/token
     */
    static async generateGitCloneToken(
        _request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext
    ): Promise<ControllerResponse<ApiResponse<GitCloneTokenData>>> {
        try {
            const user = context.user!;
            const appId = context.pathParams.id;
            
            if (!appId) {
                return AppViewController.createErrorResponse<GitCloneTokenData>('App ID is required', 400);
            }

            // Generate short-lived JWT (1 hour)
            const jwtUtils = JWTUtils.getInstance(env);
            const expiresIn = 3600; // 1 hour
            const token = await jwtUtils.createToken({
                sub: user.id,
                email: user.email,
                type: 'access' as const,
                sessionId: 'git-clone-' + appId, // Special session for git operations
            }, expiresIn);

            const responseData: GitCloneTokenData = {
                token,
                expiresIn,
                expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
                cloneUrl: buildGitCloneUrl(env, appId, token)
            };

            return AppViewController.createSuccessResponse(responseData);
        } catch (error) {
            this.logger.error('Error generating git clone token:', error);
            return AppViewController.createErrorResponse<GitCloneTokenData>('Failed to generate token', 500);
        }
    }

}