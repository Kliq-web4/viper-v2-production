import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
import { setAuthLevel, AuthConfig } from '../../middleware/auth/routeAuth';
import { adaptController } from '../honoAdapter';
import { SupabaseIntegrationController } from '../controllers/integrations/supabase/controller';

export function setupIntegrationsRoutes(app: Hono<AppEnv>): void {
  const router = new Hono<AppEnv>();

  // Add Supabase to a running agent/app - OWNER ONLY
  router.post('/supabase/:agentId/add', setAuthLevel(AuthConfig.ownerOnly), adaptController(SupabaseIntegrationController, SupabaseIntegrationController.add));

  app.route('/api/integrations', router);
}
