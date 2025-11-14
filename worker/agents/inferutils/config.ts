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
    // Planning / selection should be cheap and fast
    templateSelection: {
        name: 'gpt-4o-mini',
        max_tokens: 2000,
        fallbackModel: 'gpt-4o-mini',
        temperature: 0.6,
    },
    // Bootstrapping and blueprint
    blueprint: {
        name: 'gpt-4o-mini',
        reasoning_effort: 'medium',
        max_tokens: 64000,
        fallbackModel: 'gpt-4o-mini',
        temperature: 0.7,
    },
    projectSetup: {
        name: 'gpt-4o-mini',
        reasoning_effort: 'low',
        max_tokens: 10000,
        temperature: 0.2,
        fallbackModel: 'gpt-4o-mini',
    },
    // Phase planning uses smaller model
    phaseGeneration: {
        name: 'gpt-4o-mini',
        reasoning_effort: 'low',
        max_tokens: 32000,
        temperature: 0.2,
        fallbackModel: 'gpt-4o-mini',
    },
    // Main code generation uses a stronger coder model
    firstPhaseImplementation: {
        name: 'gpt-4o-mini',
        reasoning_effort: 'low',
        max_tokens: 64000,
        temperature: 0.2,
        fallbackModel: 'gpt-4o-mini',
    },
    phaseImplementation: {
        name: 'gpt-4o-mini',
        reasoning_effort: 'low',
        max_tokens: 64000,
        temperature: 0.2,
        fallbackModel: 'gpt-4o-mini',
    },
    realtimeCodeFixer: {
        name: 'gpt-4o-mini',
        reasoning_effort: 'low',
        max_tokens: 32000,
        temperature: 1,
        fallbackModel: 'gpt-4o-mini',
    },
    // Not used right now
    fastCodeFixer: {
        name: 'gpt-4o-mini',
        reasoning_effort: undefined,
        max_tokens: 64000,
        temperature: 0.0,
        fallbackModel: 'gpt-4o-mini',
    },
    conversationalResponse: {
        name: 'gpt-4o-mini',
        reasoning_effort: 'low',
        max_tokens: 4000,
        temperature: 0,
        fallbackModel: 'gpt-4o-mini',
    },
    deepDebugger: {
        name: 'gpt-4o-mini',
        reasoning_effort: 'high',
        max_tokens: 8000,
        temperature: 0.5,
        fallbackModel: 'gpt-4o-mini',
    },
    codeReview: {
        name: 'gpt-4o-mini',
        reasoning_effort: 'medium',
        max_tokens: 32000,
        temperature: 0.1,
        fallbackModel: 'gpt-4o-mini',
    },
    fileRegeneration: {
        name: 'gpt-4o-mini',
        reasoning_effort: 'low',
        max_tokens: 32000,
        temperature: 0,
        fallbackModel: 'gpt-4o-mini',
    },
    // Not used right now
    screenshotAnalysis: {
        name: 'gpt-4o-mini',
        reasoning_effort: 'medium',
        max_tokens: 8000,
        temperature: 0.1,
        fallbackModel: 'gpt-4o-mini',
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