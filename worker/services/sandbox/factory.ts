import { SandboxSdkClient } from "./sandboxSdkClient";
import { BaseSandboxService } from "./BaseSandboxService";

export function getSandboxService(sessionId: string, agentId: string): BaseSandboxService {
    // Force the stable local sandbox SDK to avoid remote runner template issues
    // If you explicitly need the remote runner, change this logic or set it behind a safer feature flag.
    console.log("[getSandboxService] Using sandboxsdk service for sandboxing");
    return new SandboxSdkClient(sessionId, agentId);
}
