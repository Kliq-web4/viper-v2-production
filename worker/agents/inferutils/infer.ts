import { OpenAI } from 'openai';
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
  const modelName = (args.modelName ?? args.modelConfig?.name ?? AGENT_CONFIG[args.agentActionName]?.name ?? 'openai/o4-mini') as string;

  const result = await infer({
    operationId: args.agentActionName,
    modelName,
    messages: args.messages,
    schema: args.schema as any,
  }, args.env);

  if (args.schema) {
    return { object: result.content as unknown };
  }
  return { string: result.content as string };
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

  // --- OPENAI CLIENT LOGIC ---
  logger.info(
    `Running OPENAI compatible inference with ${modelName} (attempt ${attempt}/${config.retries})`,
  );

  const openai = new OpenAI({
    // Using your 'OPENAI_API_KEY' secret
    apiKey: env.OPENAI_API_KEY as string,
    // Using the correct, direct OpenAI URL
    baseURL: 'https://api.openai.com/v1',
  });

  const payload: any = {
    model: modelName,
    messages: messages as any,
    max_tokens: maxTokens,
    temperature,
  };
  if (schema) {
    payload.response_format = { type: 'json_object' } as const;
  }
  const response = await openai.chat.completions.create(payload);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response content was empty.');
  }

  return {
    content: content,
    model: response.model,
    usage: {
      prompt_tokens: response.usage?.prompt_tokens || 0,
      completion_tokens: response.usage?.completion_tokens || 0,
      total_tokens: response.usage?.total_tokens || 0,
    },
  };
}

/**
 * Main inference function with retries and error handling.
 */
export async function infer<T extends z.AnyZodObject | undefined = undefined>(
  params: InferenceParams<T>,
  env: Env,
): Promise<InferenceResult<T>> {
  const { operationId, modelName, messages, schema } = params;
  const config = getInferenceConfig(operationId, env);
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

  for (let i = 0; i < config.retries; i++) {
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
        `Error during ${operationId} operation (attempt ${i + 1}/${config.retries}):`,
        error,
      );
      if (i === config.retries - 1) {
        throw new InferenceError(
          `Inference failed for ${operationId} after ${config.retries} attempt(s): ${error.message}`,
          error,
        );
      }
      await new Promise((resolve) =>
        setTimeout(resolve, config.retryDelay * (i + 1)),
      );
      if (i > 0) {
        logger.info(`Retrying in ${config.retryDelay * (i + 1)}ms...`);
      }
    }
  }

  throw new InferenceError(
    `Inference failed for ${operationId} after ${config.retries} attempts.`,
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