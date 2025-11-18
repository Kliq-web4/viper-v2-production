import { AgentConfig, AIModels } from "./config.types";

/*
Use these configs instead for better performance, less bugs and costs:

    blueprint: {
        name: AIModels.OPENAI_5_MINI,
        reasoning_effort: 'medium',
        max_tokens: 16000,
        fallbackModel: AIModels.OPENAI_O3,
        temperature: 1,
    },
    projectSetup: {
        name: AIModels.OPENAI_5_MINI,
        reasoning_effort: 'medium',
        max_tokens: 10000,
        temperature: 1,
        fallbackModel: AIModels.GEMINI_2_5_FLASH,
    },
    phaseGeneration: {
        name: AIModels.OPENAI_5_MINI,
        reasoning_effort: 'medium',
        max_tokens: 32000,
        temperature: 1,
        fallbackModel: AIModels.GEMINI_2_5_FLASH,
    },
    codeReview: {
        name: AIModels.OPENAI_5,
        reasoning_effort: 'medium',
        max_tokens: 32000,
        temperature: 1,
        fallbackModel: AIModels.GEMINI_2_5_PRO,
    },
    fileRegeneration: {
        name: AIModels.OPENAI_5_MINI,
        reasoning_effort: 'low',
        max_tokens: 32000,
        temperature: 1,
        fallbackModel: AIModels.CLAUDE_4_SONNET,
    },
    realtimeCodeFixer: {
        name: AIModels.OPENAI_5_MINI,
        reasoning_effort: 'low',
        max_tokens: 32000,
        temperature: 1,
        fallbackModel: AIModels.CLAUDE_4_SONNET,
    },

For real time code fixer, here are some alternatives: 
    realtimeCodeFixer: {
        name: AIModels.CEREBRAS_QWEN_3_CODER,
        reasoning_effort: undefined,
        max_tokens: 10000,
        temperature: 0.0,
        fallbackModel: AIModels.GEMINI_2_5_PRO,
    },

OR
    realtimeCodeFixer: {
        name: AIModels.KIMI_2_5,
        providerOverride: 'direct',
        reasoning_effort: 'medium',
        max_tokens: 32000,
        temperature: 0.7,
        fallbackModel: AIModels.OPENAI_OSS,
    },
*/


export const AGENT_CONFIG: AgentConfig = {
    // Planning / selection should be cheap and fast – use a small Workers model
    templateSelection: {
        name: AIModels.CF_LLAMA_3_2_3B,
        max_tokens: 2000,
        fallbackModel: AIModels.CF_OPENAI_GPT_OSS_120B, // Upgrade to more powerful model
        temperature: 0.6,
    },
    // Bootstrapping and blueprint - KEEP GEMINI (excellent at structured JSON output)
    blueprint: {
        name: 'google-ai-studio/gemini-2.5-flash',
        reasoning_effort: 'medium',
        max_tokens: 64000,
        fallbackModel: AIModels.CF_OPENAI_GPT_OSS_120B, // Fallback to Workers AI if Gemini fails
        temperature: 0.7,
    },
    // Use Workers AI for project setup and template customization
    projectSetup: {
        name: AIModels.CF_MISTRAL_SMALL_24B,
        reasoning_effort: 'low',
        max_tokens: 10000,
        temperature: 0.2,
        fallbackModel: AIModels.CF_OPENAI_GPT_OSS_120B,
    },
    // Phase planning – medium-sized Workers model with strong fallback
    phaseGeneration: {
        name: AIModels.CF_LLAMA_3_2_3B,
        reasoning_effort: 'medium',
        max_tokens: 32000,
        temperature: 0.7,
        fallbackModel: AIModels.CF_OPENAI_GPT_OSS_120B,
    },
    // Main code generation – heavy Workers AI model for implementation phases
    firstPhaseImplementation: {
        name: AIModels.CF_OPENAI_GPT_OSS_120B,
        reasoning_effort: 'medium',
        max_tokens: 64000,
        temperature: 0.3,
        fallbackModel: AIModels.CF_MISTRAL_SMALL_24B,
    },
    phaseImplementation: {
        name: AIModels.CF_OPENAI_GPT_OSS_120B,
        reasoning_effort: 'high',
        max_tokens: 64000,
        temperature: 0.3,
        fallbackModel: AIModels.CF_MISTRAL_SMALL_24B,
    },
    // Realtime code fixer – use strong coder model with Workers-only fallback
    realtimeCodeFixer: {
        name: AIModels.CF_OPENAI_GPT_OSS_120B,
        reasoning_effort: 'high',
        max_tokens: 32000,
        temperature: 0.2,
        fallbackModel: AIModels.CF_MISTRAL_SMALL_24B,
    },
    // Not used right now – keep in Workers ecosystem
    fastCodeFixer: {
        name: AIModels.CF_MISTRAL_SMALL_24B,
        reasoning_effort: undefined,
        max_tokens: 64000,
        temperature: 0.0,
        fallbackModel: AIModels.CF_OPENAI_GPT_OSS_120B,
    },
    // Chat / conversational responses – smaller model primary, larger as fallback
    conversationalResponse: {
        name: AIModels.CF_LLAMA_3_2_3B,
        reasoning_effort: 'medium',
        max_tokens: 8000,
        temperature: 0.8,
        fallbackModel: AIModels.CF_OPENAI_GPT_OSS_120B,
    },
    // Deep debugger – heavy model for analysis with smaller fallback
    deepDebugger: {
        name: AIModels.CF_OPENAI_GPT_OSS_120B,
        reasoning_effort: 'high',
        max_tokens: 8000,
        temperature: 0.1,
        fallbackModel: AIModels.CF_MISTRAL_SMALL_24B,
    },
    // Code review – balanced Workers config
    codeReview: {
        name: AIModels.CF_OPENAI_GPT_OSS_120B,
        reasoning_effort: 'medium',
        max_tokens: 32000,
        temperature: 0.1,
        fallbackModel: AIModels.CF_MISTRAL_SMALL_24B,
    },
    fileRegeneration: {
        name: AIModels.CF_OPENAI_GPT_OSS_120B,
        reasoning_effort: 'high',
        max_tokens: 32000,
        temperature: 0.2,
        fallbackModel: AIModels.CF_MISTRAL_SMALL_24B,
    },
    // Screenshot analysis – lighter model with upgrade path
    screenshotAnalysis: {
        name: AIModels.CF_LLAMA_3_2_3B,
        reasoning_effort: 'medium',
        max_tokens: 8000,
        temperature: 0.1,
        fallbackModel: AIModels.CF_OPENAI_GPT_OSS_120B,
    },
};


// Model validation utilities
export const ALL_AI_MODELS: readonly AIModels[] = Object.values(AIModels);
export type AIModelType = AIModels;

// Create tuple type for Zod enum validation
export const AI_MODELS_TUPLE = Object.values(AIModels) as [AIModels, ...AIModels[]];

export function isValidAIModel(model: string): model is AIModels {
    return Object.values(AIModels).includes(model as AIModels);
}

export function getValidAIModelsArray(): readonly AIModels[] {
    return ALL_AI_MODELS;
}