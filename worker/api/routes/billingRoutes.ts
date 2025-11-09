import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
import { WhopController } from '../controllers/billing/whopController';
import { adaptController } from '../honoAdapter';
import { AuthConfig, setAuthLevel } from '../../middleware/auth/routeAuth';

export function setupBillingRoutes(app: Hono<AppEnv>): void {
  const router = new Hono<AppEnv>();

  // Public: list plans
  router.get('/plans', setAuthLevel(AuthConfig.public), adaptController(WhopController, WhopController.getPlans));

  // Authenticated: my billing info
  router.get('/me', setAuthLevel(AuthConfig.authenticated), adaptController(WhopController, WhopController.getMe));

  // Public webhook for Whop events
  router.post('/whop/webhook', setAuthLevel(AuthConfig.public), adaptController(WhopController, WhopController.webhook));

  app.route('/api/billing', router);
}