import { BaseController } from '../baseController';
import { RouteContext } from '../../types/route-context';
import { CreditService } from '../../../database/services/CreditService';
import { getPlan, getWhopPlanMap, WhopWebhookSchema } from '../../../config/pricing';
import { createLogger } from '../../../logger';

export class WhopController extends BaseController {
  static logger = createLogger('WhopController');

  // GET /api/billing/plans (public)
  static async getPlans(_request: Request, env: Env, _ctx: ExecutionContext, _route: RouteContext): Promise<Response> {
    const plans = Object.values({ free: getPlan('free'), pro: getPlan('pro'), business: getPlan('business') }).map(p => ({
      slug: p.slug,
      name: p.name,
      monthlyCredits: p.monthlyCredits,
      dailyFreeCredits: p.dailyFreeCredits,
      rolloverLimit: p.rolloverLimit,
      resetCycleDays: p.resetCycleDays,
      priceUsd: p.priceUsd,
      checkoutUrl:
        p.slug === 'pro' ? env.WHOP_PRO_CHECKOUT_URL || null :
        p.slug === 'business' ? env.WHOP_BUSINESS_CHECKOUT_URL || null : null,
    }));
    return WhopController.createSuccessResponse({ plans });
  }

  // GET /api/billing/me (auth)
  static async getMe(_request: Request, _env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<Response> {
    try {
      const user = context.user!;
      const creditService = new CreditService(_env as Env);
      await creditService.ensureCreditsUpToDate(user.id);
      const fullUser = await creditService.getUser(user.id);
      if (!fullUser) return WhopController.createErrorResponse('User not found', 404);
      return WhopController.createSuccessResponse({
        plan: fullUser.planSlug,
        credits: fullUser.credits,
        lastDailyReset: fullUser.lastDailyReset || null,
        nextMonthlyReset: fullUser.nextMonthlyReset || null,
        billingStatus: fullUser.billingStatus || 'none',
      });
    } catch (err) {
      this.logger.error('getMe failed', err);
      return WhopController.createErrorResponse('Failed to load billing info', 500);
    }
  }

  // POST /api/billing/whop/webhook (public)
  static async webhook(request: Request, env: Env, _ctx: ExecutionContext, _route: RouteContext): Promise<Response> {
    try {
      const rawBody = await request.text();

      // Optional HMAC signature verification - header names may vary; adjust as needed
      const headerSig = request.headers.get('x-whop-signature') || request.headers.get('whop-signature');
      if (env.WHOP_WEBHOOK_SECRET && headerSig) {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          enc.encode(env.WHOP_WEBHOOK_SECRET),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['verify']
        );

        // Support signatures like 'sha256=HEX' or raw HEX or base64
        const sigRaw = headerSig.includes('=') ? headerSig.split('=')[1] : headerSig;
        const isHex = /^[0-9a-fA-F]+$/.test(sigRaw);
        const sigBytes = isHex
          ? new Uint8Array(sigRaw.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
          : Uint8Array.from(atob(sigRaw), (c) => c.charCodeAt(0));

        const ok = await crypto.subtle.verify(
          'HMAC',
          key,
          sigBytes,
          enc.encode(rawBody)
        ).catch(() => false);
        if (!ok) {
          // If verification fails, log and continue only in dev; else reject
          if (env.ENVIRONMENT === 'production' || env.ENVIRONMENT === 'prod') {
            return WhopController.createErrorResponse('Invalid signature', 401);
          }
          this.logger.warn('Webhook signature verification failed - continuing in non-prod');
        }
      }

      const json = JSON.parse(rawBody);
      const parsed = WhopWebhookSchema.safeParse(json);
      if (!parsed.success) {
        return WhopController.createErrorResponse('Invalid payload', 400);
      }

      const payload = parsed.data;
      const event = String(payload.event || '').toLowerCase();
      const creditService = new CreditService(env);

      // Attempt to extract common fields; adjust based on your Whop configuration
      const data: any = payload.data || {};
      const email = (data.user?.email || data.email || data.customer?.email || '').toLowerCase();
      const productId = data.product_id || data.price_id || data.plan_id || data.sku || data.product?.id || data.price?.id || null;
      const membershipId = data.membership_id || data.id || null;
      const status: string | undefined = data.status || undefined;

      // Resolve plan from product mapping
      const planMap = getWhopPlanMap(env);
      const planSlug = (productId && planMap[productId]) || null;

      if (!email) {
        this.logger.error('Webhook missing user email');
        return WhopController.createErrorResponse('Missing email', 400);
      }

      // Find user by email
      const { UserService } = await import('../../../database/services/UserService');
      const userSvc = new UserService(env);
      const user = await userSvc.findUser({ email });
      if (!user) {
        this.logger.warn('Webhook for unknown email', { email });
        return WhopController.createErrorResponse('User not found', 404);
      }

      // Handle event types
      if (event.includes('created') || event.includes('activated') || event.includes('payment_succeeded') || event.includes('subscribed')) {
        if (planSlug) {
          await creditService.setUserPlan(user.id, planSlug as any, {
            membershipId: membershipId || undefined,
            productId: productId || undefined,
            status: status || 'active',
          });
        }
      } else if (event.includes('canceled') || event.includes('cancelled') || event.includes('expired') || event.includes('payment_failed')) {
        // Downgrade to free on cancellation/expiry
        await creditService.setUserPlan(user.id, 'free', {
          membershipId: membershipId || undefined,
          productId: productId || undefined,
          status: 'canceled',
        });
      } else if (event.includes('one_time') || event.includes('one-time') || event.includes('topup') || event.includes('credit')) {
        // One-time credit purchase/top-up
        const amount = Number(data.credits || data.amount || data.quantity || 0);
        if (Number.isFinite(amount) && amount > 0) {
          await creditService.applyTopUp(user.id, amount, 'Whop top-up', { productId, membershipId, event });
        }
      }

      return WhopController.createSuccessResponse({ received: true });
    } catch (error) {
      this.logger.error('Webhook error', error);
      return WhopController.createErrorResponse('Webhook handling failed', 500);
    }
  }
}