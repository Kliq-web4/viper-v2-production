/**
 * Config Types - Pure type definitions only
 * Extracted from config.ts to avoid importing logic code into frontend
 */

import { ReasoningEffort } from "openai/resources.mjs";
// import { LLMCallsRateLimitConfig } from "../../services/rate-limit/config";

export enum AIModels {
    DISABLED = 'disabled',

    // Cloudflare Workers AI models (use these only)
    CF_LLAMA_3_1_8B = '@cf/meta/llama-3.1-8b-instruct',
    CF_LLAMA_3_1_70B = '@cf/meta/llama-3.1-70b-instruct',
    CF_QWEN_2_5_CODER_32B = '@cf/qwen/qwen2.5-coder-32b-instruct',
    CF_DEEPSEEK_R1_DISTILL_32B = '@cf/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
}

export interface ModelConfig {
    name: AIModels | string;
    reasoning_effort?: ReasoningEffort;
    max_tokens?: number;
    temperature?: number;
    fallbackModel?: AIModels | string;
}

export interface AgentConfig {
    templateSelection: ModelConfig;
    blueprint: ModelConfig;
    projectSetup: ModelConfig;
    phaseGeneration: ModelConfig;
    phaseImplementation: ModelConfig;
    firstPhaseImplementation: ModelConfig;
    codeReview: ModelConfig;
    fileRegeneration: ModelConfig;
    screenshotAnalysis: ModelConfig;
    realtimeCodeFixer: ModelConfig;
    fastCodeFixer: ModelConfig;
    conversationalResponse: ModelConfig;
    deepDebugger: ModelConfig;
}

// Provider and reasoning effort types for validation
export type ProviderOverrideType = 'cloudflare' | 'direct';
export type ReasoningEffortType = 'low' | 'medium' | 'high';

export type AgentActionKey = keyof AgentConfig;

export type InferenceMetadata = {
    agentId: string;
    userId: string;
    // llmRateLimits: LLMCallsRateLimitConfig;
}

export interface InferenceContext extends InferenceMetadata {
    userModelConfigs?: Record<AgentActionKey, ModelConfig>;
    enableRealtimeCodeFix: boolean;
    enableFastSmartCodeFix: boolean;
    abortSignal?: AbortSignal;
}
