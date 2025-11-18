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
    // Planning / selection – use Workers AI llama-4-scout as primary, vision model as fallback
    templateSelection: {
        name: AIModels.CF_LLAMA_4_SCOUT_17B_16E,
        max_tokens: 2000,
        fallbackModel: AIModels.CF_LLAMA_3_2_11B_VISION,
        temperature: 0.6,
    },
    // Bootstrapping and blueprint - KEEP GEMINI (excellent at structured JSON output)
    blueprint: {
        name: 'google-ai-studio/gemini-2.5-flash',
        reasoning_effort: 'medium',
        max_tokens: 64000,
        fallbackModel: AIModels.CF_OPENAI_GPT_OSS_120B, // Fallback unchanged per request (blueprint only)
        temperature: 0.7,
    },
    // Project setup and template customization – Workers AI llama-4-scout with vision fallback
    projectSetup: {
        name: AIModels.CF_LLAMA_4_SCOUT_17B_16E,
        reasoning_effort: 'low',
        max_tokens: 10000,
        temperature: 0.2,
        fallbackModel: AIModels.CF_LLAMA_3_2_11B_VISION,
    },
    // Phase planning – Workers AI llama-4-scout with vision fallback
    phaseGeneration: {
        name: AIModels.CF_LLAMA_4_SCOUT_17B_16E,
        reasoning_effort: 'medium',
        max_tokens: 32000,
        temperature: 0.7,
        fallbackModel: AIModels.CF_LLAMA_3_2_11B_VISION,
    },
    // Main code generation – implementation phases
    firstPhaseImplementation: {
        name: AIModels.CF_LLAMA_4_SCOUT_17B_16E,
        reasoning_effort: 'medium',
        max_tokens: 64000,
        temperature: 0.3,
        fallbackModel: AIModels.CF_LLAMA_3_2_11B_VISION,
    },
    phaseImplementation: {
        name: AIModels.CF_LLAMA_4_SCOUT_17B_16E,
        reasoning_effort: 'high',
        max_tokens: 64000,
        temperature: 0.3,
        fallbackModel: AIModels.CF_LLAMA_3_2_11B_VISION,
    },
    // Realtime code fixer – same Workers AI models
    realtimeCodeFixer: {
        name: AIModels.CF_LLAMA_4_SCOUT_17B_16E,
        reasoning_effort: 'high',
        max_tokens: 32000,
        temperature: 0.2,
        fallbackModel: AIModels.CF_LLAMA_3_2_11B_VISION,
    },
    // Fast code fixer – same pair
    fastCodeFixer: {
        name: AIModels.CF_LLAMA_4_SCOUT_17B_16E,
        reasoning_effort: undefined,
        max_tokens: 64000,
        temperature: 0.0,
        fallbackModel: AIModels.CF_LLAMA_3_2_11B_VISION,
    },
    // Chat / conversational responses – llama-4-scout primary
    conversationalResponse: {
        name: AIModels.CF_LLAMA_4_SCOUT_17B_16E,
        reasoning_effort: 'medium',
        max_tokens: 8000,
        temperature: 0.8,
        fallbackModel: AIModels.CF_LLAMA_3_2_11B_VISION,
    },
    // Deep debugger – analysis on llama-4-scout
    deepDebugger: {
        name: AIModels.CF_LLAMA_4_SCOUT_17B_16E,
        reasoning_effort: 'high',
        max_tokens: 8000,
        temperature: 0.1,
        fallbackModel: AIModels.CF_LLAMA_3_2_11B_VISION,
    },
    // Code review – same Workers AI pair
    codeReview: {
        name: AIModels.CF_LLAMA_4_SCOUT_17B_16E,
        reasoning_effort: 'medium',
        max_tokens: 32000,
        temperature: 0.1,
        fallbackModel: AIModels.CF_LLAMA_3_2_11B_VISION,
    },
    fileRegeneration: {
        name: AIModels.CF_LLAMA_4_SCOUT_17B_16E,
        reasoning_effort: 'high',
        max_tokens: 32000,
        temperature: 0.2,
        fallbackModel: AIModels.CF_LLAMA_3_2_11B_VISION,
    },
    // Screenshot analysis – use the vision model primarily
    screenshotAnalysis: {
        name: AIModels.CF_LLAMA_3_2_11B_VISION,
        reasoning_effort: 'medium',
        max_tokens: 8000,
        temperature: 0.1,
        fallbackModel: AIModels.CF_LLAMA_4_SCOUT_17B_16E,
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