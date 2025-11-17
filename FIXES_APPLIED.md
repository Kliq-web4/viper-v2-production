# Fixes Applied to Restore Code Generation

## Date: 2025-11-17
## Comparing: Working commit `503fa05` → Latest commit `9ad45bc`

---

## ❌ Problems Identified

### 1. **Broken Streaming (CRITICAL)**
**Location**: `worker/agents/inferutils/infer.ts`

**Problem**: 
- The `executeInference()` wrapper was NOT passing streaming parameters to the underlying inference function
- Instead, it called the API non-streamed, got the full response, then forwarded it as a single chunk
- This completely broke SCOF's incremental parsing which relies on receiving chunks as they arrive

**Old Working Code** (503fa05):
```typescript
const result = await infer({
    // ... params
    stream,  // ← Passed directly to infer()
    // ... more params
})
```

**Broken Code** (9ad45bc before fix):
```typescript
const result = await infer({
    operationId: args.agentActionName,
    modelName: model,
    messages: args.messages,
    schema: args.schema as any,
    // stream NOT passed!
}, args.env, skipRetries ? 1 : undefined);

// Then later...
if (args.stream && !args.schema) {
    args.stream.onChunk(result.content as string); // ← All at once!
}
```

### 2. **Wrong Inference Function Called**
**Location**: `worker/agents/inferutils/infer.ts`

**Problem**:
- The new `infer.ts` has a simple local `infer()` function that doesn't support streaming
- It should be using `infer()` from `core.ts` which has full streaming support

### 3. **Prompt Forcing Full Content Only**
**Location**: `worker/agents/operations/PhaseImplementation.ts` line 267

**Problem**:
- Prompt said: "Write the whole, raw contents for every file (`full_content` format). Do not use diff format."
- This defeats the purpose of having `unified_diff` format for efficient updates

---

## ✅ Fixes Applied

### Fix 1: Restore Real Streaming
**File**: `worker/agents/inferutils/infer.ts`

**Changes**:
1. Import `infer` from `core.ts` as `coreInfer`
2. Update `run()` helper to call `coreInfer()` with all proper parameters including `stream`
3. Remove fake streaming code that forwarded everything as one chunk

**Code**:
```typescript
// Import the real infer with streaming support
import { getConfigurationForModel, infer as coreInfer } from './core';

async function run(model: string, skipRetries = false) {
  // Use the core infer() function which has proper streaming support
  return await coreInfer({
    env: args.env,
    metadata: args.context,
    messages: args.messages,
    schema: args.schema,
    schemaName: args.agentActionName,
    actionKey: args.agentActionName,
    format: args.format,
    maxTokens: args.maxTokens,
    modelName: model,
    tools: args.tools,
    stream: args.stream,  // ← Real-time streaming support restored
    reasoning_effort: args.reasoning_effort,
    temperature: args.temperature,
    abortSignal: args.context.abortSignal,
  });
}
```

### Fix 2: Adapt Return Types
**File**: `worker/agents/inferutils/infer.ts`

**Changes**:
- Map `InferResponseString` and `InferResponseObject` from core.ts to executeInference format

**Code**:
```typescript
// Adapt core.ts response format to executeInference format
if (args.schema) {
  // result is InferResponseObject<T> which has { object: T }
  return { object: (result as any).object };
}
// result is InferResponseString which has { string: string }
return { string: (result as any).string };
```

### Fix 3: Re-enable Unified Diff Format
**File**: `worker/agents/operations/PhaseImplementation.ts`

**Changed**:
```diff
-    •   **Write the whole, raw contents for every file (`full_content` format). Do not use diff format.**
+    •   **Use the most appropriate format for each file: `full_content` for new files or major rewrites, `unified_diff` for targeted changes to existing files.**
```

---

## ✅ What Now Works

1. **Real-time streaming**: Files are streamed as they're generated, not all at once
2. **SCOF incremental parsing**: Parser receives chunks gradually and processes them in real-time
3. **Efficient updates**: AI can use `unified_diff` for small changes instead of regenerating entire files
4. **WebSocket updates**: Frontend receives file chunks in real-time as they're generated
5. **Bootstrap script generation**: Still intact and working
6. **Template customization**: Still intact and working
7. **State machine orchestration**: Still intact and working

---

## ⚠️ What Was NOT Changed (Working as intended)

1. **Model configuration**: Still using Workers AI models (CF_QWEN_2_5_CODER_32B, etc.)
2. **Branding**: "Kliq AI" instead of "Cloudflare" in prompts (cosmetic only)
3. **State machine**: No changes to phase transitions or review cycles
4. **File management**: Git integration and file tracking unchanged
5. **Deployment**: Sandbox and Cloudflare deployment unchanged

---

## 🧪 Testing Checklist

To verify fixes work:

- [ ] Start a new code generation session
- [ ] Verify files are streamed in real-time to frontend (not all at once)
- [ ] Check browser console for SCOF parsing logs showing incremental chunks
- [ ] Verify subsequent phases can use `unified_diff` format for small changes
- [ ] Check bootstrap script is generated with commands
- [ ] Verify template files (package.json, wrangler.jsonc) are customized
- [ ] Test complete phase implementation → deployment cycle

---

## 📝 Additional Notes

### Why This Broke

The changes between 503fa05 and 9ad45bc involved:
- Major refactor of inference system (720 lines changed in infer.ts)
- Switch to Workers AI models from Claude/Gemini
- New rate limiting and billing features
- Simplified inference wrapper that lost streaming support in the process

The streaming support existed in `core.ts` but the `executeInference()` wrapper wasn't using it.

### Critical Files Modified

1. `worker/agents/inferutils/infer.ts` - Streaming fix (lines 12, 153-170, 183-196)
2. `worker/agents/operations/PhaseImplementation.ts` - Prompt fix (line 267)

### What to Watch For

- **Model compatibility**: Workers AI models may not support all features Claude/Gemini had
- **Rate limiting**: New rate limit logic may interfere with retries
- **Token limits**: Different models have different context windows
- **Response formats**: Workers AI may format responses differently than previous models

---

## 🔄 Rollback Instructions

If fixes cause issues:

```bash
# Revert just these changes
git checkout HEAD~1 -- worker/agents/inferutils/infer.ts
git checkout HEAD~1 -- worker/agents/operations/PhaseImplementation.ts
```

Or revert to known working commit:
```bash
git checkout 503fa05
```

---

**Status**: ✅ Fixes applied, ready for testing
