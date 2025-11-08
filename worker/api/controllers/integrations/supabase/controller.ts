import { BaseController } from '../../baseController';
import { ApiResponse, ControllerResponse } from '../../types';
import { RouteContext } from '../../../types/route-context';
import { getAgentStub } from '../../../../agents';

export class SupabaseIntegrationController extends BaseController {
  static async add(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<{ message: string }>>> {
    try {
      const agentId = context.pathParams.agentId;
      if (!agentId) {
        return SupabaseIntegrationController.createErrorResponse<{ message: string }>('Missing agent ID parameter', 400);
      }

      // Ensure platform-managed Supabase configuration exists
      const hasUrl = typeof env.SUPABASE_URL === 'string' && !!env.SUPABASE_URL;
      const hasAnon = typeof env.SUPABASE_ANON_KEY === 'string' && !!env.SUPABASE_ANON_KEY;
      if (!hasUrl || !hasAnon) {
        return SupabaseIntegrationController.createErrorResponse<{ message: string }>('Supabase is not configured on this platform instance', 400);
      }

      const agent = await getAgentStub(env, agentId);
      if (!agent || !(await agent.isInitialized())) {
        return SupabaseIntegrationController.createErrorResponse<{ message: string }>('Agent not found or not initialized', 404);
      }

      const result = await agent.addSupabaseIntegration();
      if (!result?.success) {
        return SupabaseIntegrationController.createErrorResponse<{ message: string }>(result?.message || 'Failed to add Supabase', 500);
      }

      return SupabaseIntegrationController.createSuccessResponse({ message: result.message || 'Supabase added' });
    } catch (error) {
      this.logger.error('Error adding Supabase integration', error);
      return SupabaseIntegrationController.createErrorResponse<{ message: string }>('Failed to add Supabase integration', 500);
    }
  }
}
