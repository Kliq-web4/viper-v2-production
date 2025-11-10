import { ToolDefinition } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from 'worker/agents/services/implementations/CodingAgent';
import { RenderToolCall } from 'worker/agents/operations/UserConversationProcessor';

export function createDeepDebuggerTool(
	agent: CodingAgentInterface,
	logger: StructuredLogger,
    toolRenderer: RenderToolCall,
    streamCb: (chunk: string) => void,
): ToolDefinition<
	{ issue: string; focus_paths?: string[] },
	{ transcript: string } | { error: string }
> {
	// === CONFIGURABLE DEBUG LIMIT ===
	// Defaults to 1 if not provided. Can be set via .dev.vars -> MAX_DEBUG_CALLS
	const MAX_DEBUG_CALLS = parseInt(((globalThis as any)?.process?.env?.MAX_DEBUG_CALLS ?? '1') as string, 10);
	// Track calls per conversation turn (resets when buildTools is called again)
	let callCount = 0;
	
	return {
		type: 'function',
		function: {
			name: 'deep_debug',
			description:
				`Autonomous debugging assistant that investigates errors, reads files, and applies fixes. CANNOT run during code generation - will return GENERATION_IN_PROGRESS if generation is active. Limited to up to ${MAX_DEBUG_CALLS} call(s) per conversation turn (configurable via MAX_DEBUG_CALLS).`,
			parameters: {
				type: 'object',
				properties: {
					issue: { type: 'string' },
					focus_paths: { type: 'array', items: { type: 'string' } },
				},
				required: ['issue'],
			},
		},
		implementation: async ({ issue, focus_paths }: { issue: string; focus_paths?: string[] }) => {
			// Enforce per-turn limit
			if (callCount >= MAX_DEBUG_CALLS) {
				logger.warn('Cannot start debugging: Call limit exceeded for this turn', { callCount, MAX_DEBUG_CALLS });
				return {
					error: `CALL_LIMIT_EXCEEDED: Max ${MAX_DEBUG_CALLS} deep_debug call(s) per conversation turn. Set MAX_DEBUG_CALLS in .dev.vars to increase.`,
				};
			}
			
			// Increment call counter
			callCount++;
			
			// Check if code generation is in progress
			if (agent.isCodeGenerating()) {
				logger.warn('Cannot start debugging: Code generation in progress');
				return {
					error: 'GENERATION_IN_PROGRESS: Code generation is currently running. Use wait_for_generation tool, then retry deep_debug.'
				};
			}

			// Check if another debug session is running
			if (agent.isDeepDebugging()) {
				logger.warn('Cannot start debugging: Another debug session in progress');
				return {
					error: 'DEBUG_IN_PROGRESS: Another debug session is currently running. Wait for it to finish, and if it doesn\'t, solve the issue, Use wait_for_debug tool, then retry deep_debug.'
				};
			}

			// Execute debug session - agent handles all logic internally
			const result = await agent.executeDeepDebug(issue, toolRenderer, streamCb, focus_paths);
			
			// Convert discriminated union to tool response format
			if (result.success) {
				return { transcript: result.transcript };
			} else {
				return { error: result.error };
			}
		},
	};
}
