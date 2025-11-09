import { isOriginAllowed } from '../../config/security';
import { createLogger } from '../../logger';

const logger = createLogger('WebSocketSecurity');

export function validateWebSocketOrigin(request: Request, env: Env): boolean {
    const origin = request.headers.get('Origin');
    const requestHost = new URL(request.url).host;

    // If origin is missing, allow only if request comes from same host (e.g., service/internal calls)
    if (!origin) {
        logger.warn('WebSocket connection attempt without Origin header');
        return true; // be permissive for non-browser clients
    }

    try {
        const originUrl = new URL(origin);
        // Always allow same-host requests
        if (originUrl.host === requestHost) {
            return true;
        }
    } catch {}

    if (!isOriginAllowed(env, origin)) {
        logger.warn('WebSocket connection rejected from unauthorized origin', { origin, requestHost });
        return false;
    }

    return true;
}

export function getWebSocketSecurityHeaders(): Record<string, string> {
    return {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block'
    };
}
