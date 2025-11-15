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
        name: 'gemini-1.5-flash',
        max_tokens: 2000,
        fallbackModel: '@cf/gemini-1.5-flash',
        temperature: 0.6,
    },
    // Bootstrapping and blueprint
    blueprint: {
        name: 'gemini-1.5-flash',
        reasoning_effort: 'medium',
        max_tokens: 64000,
        fallbackModel: '@cf/gemini-1.5-flash',
        temperature: 0.7,
    },
    projectSetup: {
        name: 'gemini-1.5-flash',
        reasoning_effort: 'low',
        max_tokens: 10000,
        temperature: 0.2,
        fallbackModel: '@cf/gemini-1.5-flash',
    },
    // Phase planning uses smaller model
    phaseGeneration: {
        name: 'gemini-1.5-flash',
        reasoning_effort: 'medium',
        max_tokens: 32000,
        temperature: 0.7,
        fallbackModel: '@cf/gemini-1.5-flash',
    },
    // Main code generation uses a stronger coder model
    firstPhaseImplementation: {
        name: 'gemini-1.5-flash',
        reasoning_effort: 'low',
        max_tokens: 64000,
        temperature: 0.2,
        fallbackModel: '@cf/gemini-1.5-flash',
    },
    phaseImplementation: {
        name: 'gemini-1.5-flash',
        reasoning_effort: 'high',
        max_tokens: 64000,
        temperature: 0.3,
        fallbackModel: '@cf/gemini-1.5-flash',
    },
    realtimeCodeFixer: {
        name: 'gemini-1.5-flash',
        reasoning_effort: 'high',
        max_tokens: 32000,
        temperature: 0.2,
        fallbackModel: '@cf/gemini-1.5-flash',
    },
    // Not used right now
    fastCodeFixer: {
        name: 'gemini-1.5-flash',
        reasoning_effort: undefined,
        max_tokens: 64000,
        temperature: 0.0,
        fallbackModel: '@cf/gemini-1.5-flash',
    },
    conversationalResponse: {
        name: 'gemini-1.5-flash',
        reasoning_effort: 'medium',
        max_tokens: 8000,
        temperature: 0.8,
        fallbackModel: '@cf/gemini-1.5-flash',
    },
    deepDebugger: {
        name: 'gemini-1.5-pro',
        reasoning_effort: 'high',
        max_tokens: 8000,
        temperature: 0.1,
        fallbackModel: '@cf/gemini-1.5-pro',
    },
    codeReview: {
        name: 'gemini-1.5-flash',
        reasoning_effort: 'medium',
        max_tokens: 32000,
        temperature: 0.1,
        fallbackModel: '@cf/gemini-1.5-flash',
    },
    fileRegeneration: {
        name: 'gemini-1.5-flash',
        reasoning_effort: 'high',
        max_tokens: 32000,
        temperature: 0.2,
        fallbackModel: '@cf/gemini-1.5-flash',
    },
    // Not used right now
    screenshotAnalysis: {
        name: 'gemini-1.5-flash',
        reasoning_effort: 'medium',
        max_tokens: 8000,
        temperature: 0.1,
        fallbackModel: '@cf/gemini-1.5-flash',
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