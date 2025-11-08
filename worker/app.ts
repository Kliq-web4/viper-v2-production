import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { getCORSConfig, getSecureHeadersConfig } from './config/security';
import { AppEnv } from './types/appenv';
import { setupRoutes } from './api/routes';
import { getGlobalConfigurableSettings } from './config';
import { AuthConfig, setAuthLevel } from './middleware/auth/routeAuth';
// import { initHonoSentry } from './observability/sentry';

export function createApp(env: Env): Hono<AppEnv> {
    const app = new Hono<AppEnv>();

    // Observability: Sentry error reporting & context
    // initHonoSentry(app);

    // Apply global security middlewares (skip for WebSocket upgrades)
    app.use('*', async (c, next) => {
        // Skip secure headers for WebSocket upgrade requests
        const upgradeHeader = c.req.header('upgrade');
        if (upgradeHeader?.toLowerCase() === 'websocket') {
            return next();
        }
        // Apply secure headers
        return secureHeaders(getSecureHeadersConfig(env))(c, next);
    });
    
    // CORS configuration
    app.use('/api/*', cors(getCORSConfig(env)));

    app.use('/api/*', async (c, next) => {
        // Apply global config middleware
        const config = await getGlobalConfigurableSettings(env);
        c.set('config', config);

        // Rate limits disabled globally
        await next();
    })

    // By default, all routes require authentication
    app.use('/api/*', setAuthLevel(AuthConfig.ownerOnly));

    // Now setup all the routes
    setupRoutes(app);

    // Add not found route to redirect to ASSETS
    app.notFound((c) => {
        return c.env.ASSETS.fetch(c.req.raw);
    });
    return app;
}
