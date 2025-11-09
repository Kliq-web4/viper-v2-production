// Lightweight local UI state snapshot so previous chats resume instantly
// Data is UI-only; server remains the source of truth.

export type ChatSnapshot = {
  projectStages?: any[];
  phaseTimeline?: any[];
  previewUrl?: string;
  isPreviewDeploying?: boolean;
  isGenerating?: boolean;
  isThinking?: boolean;
  isRedeployReady?: boolean;
  cloudflareDeploymentUrl?: string;
  snapshotAt: number;
};

const KEY_PREFIX = 'viper-chat-snapshot:';

function key(chatId: string) {
  return `${KEY_PREFIX}${chatId}`;
}

export function loadSnapshot(chatId?: string): ChatSnapshot | null {
  try {
    if (!chatId) return null;
    const raw = localStorage.getItem(key(chatId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatSnapshot;
    return parsed || null;
  } catch {
    return null;
  }
}

export function saveSnapshot(chatId?: string, snapshot?: Partial<ChatSnapshot>): void {
  try {
    if (!chatId || !snapshot) return;
    const prev = loadSnapshot(chatId) || { snapshotAt: Date.now() };
    const merged: ChatSnapshot = {
      ...prev,
      ...snapshot,
      snapshotAt: Date.now(),
    };
    localStorage.setItem(key(chatId), JSON.stringify(merged));
  } catch {
    // ignore quota/serialization errors
  }
}

export function clearSnapshot(chatId?: string): void {
  try {
    if (!chatId) return;
    localStorage.removeItem(key(chatId));
  } catch {
    // ignore
  }
}