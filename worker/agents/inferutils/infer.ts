import OpenAI from 'openai';
// Note: We will dynamically import the Google SDK to avoid build-time resolution issues
// when the dependency is not present during typecheck in some environments.
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Message } from './common';
import { createLogger } from '../../logger';
import { AGENT_CONFIG } from './config';
import { AIModels, AgentActionKey, InferenceContext, ModelConfig } from './config.types';
import type { ReasoningEffort } from 'openai/resources.mjs';
import type { SchemaFormat } from './schemaFormatters';
import { getConfigurationForModel, infer as coreInfer } from './core';

const logger = createLogger('InferenceUtils');

// Local helper types matching minimal needs of this module
export interface InferenceConfig {
  maxTokens: number;
  temperature: number;
  retries: number;
  retryDelay: number;
}

export interface InferenceResult<T = unknown> {
  content: string | T;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface InferenceParams<T extends z.AnyZodObject | undefined = undefined> {
  operationId: string;
  modelName: string;
  messages: Message[];
  schema?: T;
}

export class InferenceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'InferenceError';
  }
}

// Lightweight helpers normally coming from other utilities
function formatZodErrors(e: z.ZodError): string {
  return e.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
}

function getInferenceConfig(_operationId: string, _env: Env): InferenceConfig {
  // Provide conservative defaults; per-operation tuning can be added later
  return { maxTokens: 16000, temperature: 0.2, retries: 3, retryDelay: 400 };
}

function getTokenCounter(_modelName: string) {
  // Approximate token counter: ~4 chars per token
  return (messages: Message[]) => Math.ceil(JSON.stringify(messages).length / 4);
}

function trimMessages(
  messages: Message[],
  _maxTokens: number,
  _tokenCounter: (m: Message[]) => number,
): { trimmedMessages: Message[]; originalSize: number; newSize: number; trimmable: boolean } {
  const originalSize = JSON.stringify(messages).length;
  return { trimmedMessages: messages, originalSize, newSize: originalSize, trimmable: false };
}

// Helper to convert OpenAI messages to Google Generative AI format
function convertMessagesToGoogle(messages: Message[]): any[] {
  const history = messages
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content as string }], // Assumes text-only content for now
    }));
  return history;
}

// Compatibility wrapper matching the previous executeInference API used across the codebase
export async function executeInference<T extends z.AnyZodObject>(
  args: {
    env: Env;
    messages: Message[];
    maxTokens?: number;
    temperature?: number;
    modelName?: AIModels | string;
    retryLimit?: number;
    agentActionName: AgentActionKey;
    tools?: unknown[];
    stream?: { chunk_size: number; onChunk: (chunk: string) => void };
    reasoning_effort?: ReasoningEffort;
    modelConfig?: ModelConfig;
    context: InferenceContext;
    format?: SchemaFormat;
    schema: T;
  }
): Promise<{ object: z.infer<T> }>;

export async function executeInference(
  args: {
    env: Env;
    messages: Message[];
    maxTokens?: number;
    temperature?: number;
    modelName?: AIModels | string;
    retryLimit?: number;
    agentActionName: AgentActionKey;
    tools?: unknown[];
    stream?: { chunk_size: number; onChunk: (chunk: string) => void };
    reasoning_effort?: ReasoningEffort;
    modelConfig?: ModelConfig;
    context: InferenceContext;
    format?: SchemaFormat;
  }
): Promise<{ string: string }>;

export async function executeInference(
  args: {
    env: Env;
    messages: Message[];
    maxTokens?: number;
    temperature?: number;
    modelName?: AIModels | string;
    retryLimit?: number;
    agentActionName: AgentActionKey;
    tools?: unknown[];
    stream?: { chunk_size: number; onChunk: (chunk: string) => void };
    reasoning_effort?: ReasoningEffort;
    modelConfig?: ModelConfig;
    context: InferenceContext;
    format?: SchemaFormat;
    schema?: z.AnyZodObject;
  }
): Promise<{ object: unknown } | { string: string }> {
  const chosen = AGENT_CONFIG[args.agentActionName];
  const primaryModel = (args.modelName ?? args.modelConfig?.name ?? chosen?.name ?? AIModels.CF_LLAMA_3_1_8B) as string;
  const fallbackModel = (args.modelConfig?.fallbackModel ?? chosen?.fallbackModel ?? 'google-ai-studio/gemini-2.5-flash') as string;

  // Helper to check if error is rate limit/overload related
  function isRateLimitError(error: any): boolean {
    const errorMsg = error?.message?.toLowerCase() || '';
    return errorMsg.includes('503') || 
           errorMsg.includes('overloaded') || 
           errorMsg.includes('rate limit') ||
           errorMsg.includes('quota') ||
           errorMsg.includes('429');
  }

  async function run(model: string) {
    // Use the core infer() function which has proper streaming support
    // Match working commit pattern: conditionally call with/without schema
    return args.schema
      ? await coreInfer({
          env: args.env,
          metadata: args.context,
          messages: args.messages,
          schema: args.schema,
          schemaName: args.agentActionName,
          actionKey: args.agentActionName,
          format: args.format,
          maxTokens: args.maxTokens,
          modelName: model,
          tools: args.tools as any,
          stream: args.stream,
          reasoning_effort: args.reasoning_effort,
          temperature: args.temperature,
          abortSignal: args.context.abortSignal,
        })
      : await coreInfer({
          env: args.env,
          metadata: args.context,
          messages: args.messages,
          maxTokens: args.maxTokens,
          modelName: model,
          tools: args.tools as any,
          stream: args.stream,
          actionKey: args.agentActionName,
          reasoning_effort: args.reasoning_effort,
          temperature: args.temperature,
          abortSignal: args.context.abortSignal,
        });
  }

  let result;
  try {
    result = await run(primaryModel);
  } catch (e) {
    const isRateLimit = isRateLimitError(e);
    if (isRateLimit) {
      logger.warn(`Primary model rate limited/overloaded (${primaryModel}); immediately falling back to ${fallbackModel}`, e as any);
    } else {
      logger.warn(`Primary model failed (${primaryModel}); falling back to ${fallbackModel}`, e as any);
    }
    // Try fallback model
    result = await run(fallbackModel);
  }

  // Streaming is now handled directly by the infer() function in core.ts
  // No need to forward as a single chunk - chunks are streamed as they arrive

  // Adapt core.ts response format to executeInference format
  if (args.schema) {
    // result is InferResponseObject<T> which has { object: T }
    return { object: (result as any).object };
  }
  // result is InferResponseString which has { string: string }
  return { string: (result as any).string };
}

/**
 * Executes an inference request against the appropriate provider (OpenAI or Google)
 * based on the model name.
 */
async function runProviderInference<T extends z.AnyZodObject | undefined>(
  params: InferenceParams<T>,
  env: Env,
  attempt: number,
  config: InferenceConfig,
): Promise<InferenceResult<T>> {
  const { modelName, messages, schema } = params;
  const { maxTokens, temperature } = config;

  // --- NATIVE GOOGLE GEMINI CLIENT LOGIC ---
  if (modelName.startsWith('google-ai-studio/')) {
    logger.info(
      `Running GEMINI native inference with ${modelName} (attempt ${attempt}/${config.retries})`,
    );

    // Dynamically import Google SDK
    const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = (await import('@google/generative-ai')) as any;

    const googleAi = new GoogleGenerativeAI(
      env.GOOGLE_AI_STUDIO_API_KEY as string,
    );

    const modelFamily = modelName.split('/')[1]; // e.g., "gemini-2.5-flash-lite"

    const model = googleAi.getGenerativeModel({
      model: modelFamily,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
        ...(schema
          ? { responseMimeType: 'application/json' }
          : { responseMimeType: 'text/plain' }),
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const systemPrompt = messages.find((m) => m.role === 'system')?.content || '';
    const history = convertMessagesToGoogle(
      messages.filter((m) => m.role !== 'system'),
    );
    const lastMessage = history.pop(); // Get the last user message

    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('Last message must be from a user for Gemini.');
    }

    if (systemPrompt) {
      lastMessage.parts[0].text = `${systemPrompt}\n\n---\n\nUSER REQUEST:\n${lastMessage.parts[0].text}`;
    }

    if (schema) {
      const jsonSchema = zodToJsonSchema(schema);
      lastMessage.parts[0].text += `\n\nIMPORTANT: You MUST respond in JSON format that strictly adheres to the following JSON schema:\n${JSON.stringify(jsonSchema, null, 2)}`;
    }

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(lastMessage.parts);
    const response = result.response;
    const responseText = response.text();

    if (!responseText) {
      throw new Error('Gemini response was empty.');
    }

    return {
      content: responseText,
      model: modelName,
      usage: {
        prompt_tokens: 0, // Google SDK does not easily provide token counts
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }

  // --- CLOUDLFARE AI GATEWAY / OPENAI-COMPAT LOGIC ---
  logger.info(
    `Running OpenAI-compatible inference with ${modelName} (attempt ${attempt}/${config.retries})`,
  );

  // Resolve baseURL/apiKey depending on provider (Workers AI vs OpenAI)
  const { baseURL, apiKey, defaultHeaders } = await getConfigurationForModel(modelName, env, (env as any).CURRENT_USER_ID || 'system');
  const openai = new OpenAI({
    apiKey: apiKey as string,
    baseURL: baseURL as string,
    defaultHeaders: defaultHeaders as any,
  });

  // For Workers AI models, pass the full model id (e.g., '@cf/meta/llama-3.1-8b-instruct')
  // For OpenAI models, strip provider prefix
  const openaiModel = modelName.startsWith('@cf/')
    ? modelName
    : (modelName.includes('/') ? modelName.split('/')[1] : modelName);

  // Extract system messages as high-priority instructions
  const systemInstructions = (messages || [])
    .filter((m) => m.role === 'system' && typeof m.content === 'string')
    .map((m) => m.content as string)
    .join('\n\n');

  // Map remaining messages to Responses API input format
  const input = (messages || [])
    .filter((m) => m.role !== 'system')
    .map((m) => {
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      let content: string = '';
      if (typeof m.content === 'string') {
        content = m.content as string;
      } else if (Array.isArray(m.content)) {
        // Flatten multimodal content to text for now
        content = m.content
          .map((c: any) => (c?.type === 'text' ? c.text : '[image]'))
          .join('\n');
      }
      return { role, content } as any;
    });

  const request: any = {
    model: openaiModel,
    input,
  };

  // Temperature and token limits (Responses API uses max_output_tokens)
  if (typeof temperature === 'number') request.temperature = temperature;
  if (typeof maxTokens === 'number') request.max_output_tokens = maxTokens;

  // If a JSON schema is provided, request structured output
  if (schema) {
    const jsonSchema = zodToJsonSchema(schema as any);
    request.response_format = {
      type: 'json_schema',
      json_schema: {
        name: params.operationId || 'structured_output',
        schema: jsonSchema,
        strict: true,
      },
    } as const;
  }

  if (systemInstructions.length > 0) {
    request.instructions = systemInstructions;
  }

  try {
    const response = await openai.responses.create(request);
    const text = (response as any).output_text as string | undefined;
    if (!text || text.length === 0) {
      throw new Error('OpenAI Responses API returned empty output_text.');
    }
    // Usage metrics are different in Responses; default to 0 if missing
    return {
      content: text,
      model: openaiModel,
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  } catch (err) {
    // Fallback to Chat Completions if Responses API is unavailable
    logger.warn('Responses API call failed; falling back to Chat Completions', err as any);
    const chatPayload: any = {
      model: openaiModel,
      messages: messages as any,
      temperature,
    };
    if (typeof maxTokens === 'number') {
      // Chat Completions uses max_tokens
      chatPayload.max_tokens = maxTokens;
    }
    if (schema) {
      chatPayload.response_format = { type: 'json_object' } as const;
    }
    const chat = await openai.chat.completions.create(chatPayload);
    const rawContent = chat.choices[0]?.message?.content as any;

    // Normalize content to a plain string so downstream SCOF parsing and streaming work reliably
    let contentText = '';
    if (Array.isArray(rawContent)) {
      // OpenAI-style content array (e.g., [{ type: 'text', text: '...' }])
      contentText = rawContent
        .map((part: any) => {
          if (typeof part === 'string') return part;
          if (part && typeof part.text === 'string') return part.text;
          if (part && part.type === 'text' && typeof part.text === 'string') return part.text;
          return '';
        })
        .join('');
    } else if (typeof rawContent === 'string') {
      contentText = rawContent;
    }

    if (!contentText || contentText.trim().length === 0) {
      throw new Error('OpenAI fallback (Chat Completions) returned empty content.');
    }

    return {
      content: contentText,
      model: chat.model,
      usage: {
        prompt_tokens: chat.usage?.prompt_tokens || 0,
        completion_tokens: chat.usage?.completion_tokens || 0,
        total_tokens: chat.usage?.total_tokens || 0,
      },
    };
  }
}

/**
 * Main inference function with retries and error handling.
 */
export async function infer<T extends z.AnyZodObject | undefined = undefined>(
  params: InferenceParams<T>,
  env: Env,
  maxRetries?: number,
): Promise<InferenceResult<T>> {
  const { operationId, modelName, messages, schema } = params;
  const config = getInferenceConfig(operationId, env);
  const retries = maxRetries ?? config.retries;
  const tokenCounter = getTokenCounter(modelName);

  const { trimmedMessages, ...trimStats } = await trimMessages(
    messages,
    config.maxTokens,
    tokenCounter,
  );

  if (trimStats.trimmable) {
    logger.info(
      `Token optimization: Original messages size ~${trimStats.originalSize} chars, optimized size ~${trimStats.newSize} chars`,
    );
  }

  const paramsWithTrimmedMessages = { ...params, messages: trimmedMessages };

  for (let i = 0; i < retries; i++) {
    try {
      const attempt = i + 1;
      const result = await runProviderInference(
        paramsWithTrimmedMessages as InferenceParams<T>,
        env,
        attempt,
        config,
      );

      if (schema) {
        try {
          const parsed = JSON.parse(result.content as string);
          const validation = schema.safeParse(parsed);
          if (validation.success) {
            return {
              ...result,
              content: validation.data as any,
            };
          }
          logger.warn(
            `Schema validation failed for ${operationId}: ${formatZodErrors(validation.error)}`,
          );
          throw new Error(
            `Schema validation failed: ${formatZodErrors(validation.error)}`,
          );
        } catch (e: any) {
          logger.warn(
            `Failed to parse JSON for ${operationId} (attempt ${attempt}/${config.retries}): ${e.message}`,
          );
          throw new Error(
            `Failed to parse JSON: ${e.message}. Raw content: ${(result.content as string).substring(0, 100)}...`,
          );
        }
      }

      return {
        ...result,
        content: result.content as any,
      };
    } catch (error: any) {
      logger.error(
        `Error during ${operationId} operation (attempt ${i + 1}/${retries}):`,
        error,
      );
      if (i === retries - 1) {
        throw new InferenceError(
          `Inference failed for ${operationId} after ${retries} attempt(s): ${error.message}`,
          error,
        );
      }
      
      // Check if it's a rate limit or overload error - use exponential backoff
      const errorMsg = error?.message?.toLowerCase() || '';
      const isRateLimit = errorMsg.includes('503') || 
                          errorMsg.includes('overloaded') || 
                          errorMsg.includes('rate limit') ||
                          errorMsg.includes('quota') ||
                          errorMsg.includes('429');
      
      // Use exponential backoff for rate limit errors, regular backoff otherwise
      const delayMs = isRateLimit 
        ? config.retryDelay * Math.pow(2, i + 1) // Exponential: 800ms, 1600ms, 3200ms
        : config.retryDelay * (i + 1);            // Linear: 400ms, 800ms, 1200ms
      
      logger.info(`Retrying in ${delayMs}ms... (${isRateLimit ? 'rate limit detected - exponential backoff' : 'linear backoff'})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new InferenceError(
    `Inference failed for ${operationId} after ${retries} attempts.`,
  );
}

/**
 * A simpler inference utility that doesn't use structured schemas or retries.
 */
export async function inferSimple(
  params: Omit<InferenceParams, 'operationId' | 'schema'>,
  env: Env,
): Promise<string> {
  const { modelName } = params;

  try {
    const config = getInferenceConfig('simple', env);
    const result = await runProviderInference(
      { ...params, operationId: 'simple' },
      env,
      1,
      {
        ...config,
        retries: 1, // No retries for simple inference
      },
    );
    return result.content as string;
  } catch (error: any) {
    logger.error(`Error during simple inference with ${modelName}:`, error);
    throw new InferenceError(
      `Simple inference failed: ${error.message}`,
      error,
    );
  }
}