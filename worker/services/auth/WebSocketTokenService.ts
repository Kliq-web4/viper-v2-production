import { createKVCache, KVCache } from '../cache/KVCache';
import { generateNanoId } from '../../utils/idGenerator';

interface TokenRecord {
  userId: string;
  agentId: string;
  createdAt: number;
}

export class WebSocketTokenService {
  private cache: KVCache;
  private static PREFIX = 'ws-token';

  constructor(env: Env) {
    this.cache = createKVCache(env);
  }

  async issue(userId: string, agentId: string, ttlSeconds: number = 60): Promise<string> {
    const token = generateNanoId();
    const rec: TokenRecord = { userId, agentId, createdAt: Date.now() };
    await this.cache.set<TokenRecord>(WebSocketTokenService.PREFIX, token, rec, ttlSeconds);
    return token;
  }

  async validateAndConsume(token: string, agentId: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const rec = await this.cache.get<TokenRecord>(WebSocketTokenService.PREFIX, token);
      if (!rec) return { valid: false };
      if (rec.agentId !== agentId) return { valid: false };
      // Single-use: delete immediately after validation
      await this.cache.delete(WebSocketTokenService.PREFIX, token);
      return { valid: true, userId: rec.userId };
    } catch {
      return { valid: false };
    }
  }
}