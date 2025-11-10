import { createLogger } from '../../../../logger';
import { BaseController } from '../../baseController';
import { ApiResponse, ControllerResponse } from '../../types';
import type { RouteContext } from '../../../types/route-context';
import { AppService } from '../../../../database/services/AppService';
import { getAgentStub } from '../../../../agents';

export class SupabaseIntegrationController extends BaseController {
  static logger = createLogger('SupabaseIntegrationController');

  static async add(
    _request: Request,
    env: Env,
    _ctx: ExecutionContext,
    context: RouteContext
  ): Promise<ControllerResponse<ApiResponse<{ message: string }>>> {
    const agentId = context.pathParams.agentId || context.pathParams.id;
    const user = context.user;

    if (!agentId) {
      return BaseController.createErrorResponse('Agent ID is required', 400);
    }
    if (!user) {
      return BaseController.createErrorResponse('Authentication required', 401);
    }

    try {
      // 1. Verify app ownership
      const appService = new AppService(env);
      const ownership = await appService.checkAppOwnership(agentId, user.id);
      if (!ownership.isOwner) {
        return BaseController.createErrorResponse('Forbidden', 403);
      }

      // 2. Get the Agent's Durable Object stub
      const agentStub = await getAgentStub(env, agentId);

      // 3. Trigger the integration on the Agent DO
      const result = await agentStub.addSupabaseIntegration();
      if (!result?.success) {
        throw new Error(result?.message || 'Agent failed to add Supabase integration');
      }

      // 4. Return success to the client
      return BaseController.createSuccessResponse({
        message: result.message || 'Supabase integration successfully initiated.'
      });
    } catch (error) {
      this.logger.error('Error triggering Supabase integration:', error as any);
      return BaseController.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to add Supabase integration',
        500
      );
    }
  }
}
