import { BaseService } from './BaseService';
import * as schema from '../schema';
import { eq, sql } from 'drizzle-orm';
import { getPlan, isPaidPlan, PlanSlug } from '../../config/pricing';
import { generateId } from '../../utils/idGenerator';

export class CreditService extends BaseService {
  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async getUser(userId: string) {
    const user = await this.database.select().from(schema.users).where(eq(schema.users.id, userId)).get();
    return user;
  }

  async ensureDailyReset(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    const plan = getPlan(user.planSlug as string);
    if (plan.slug !== 'free' || plan.dailyFreeCredits <= 0) return;

    const today = this.startOfToday();
    const last = user.lastDailyReset ? new Date(user.lastDailyReset) : new Date(0);
    if (last < today) {
      // Add daily free credits
      await this.database.update(schema.users)
        .set({
          credits: sql`${schema.users.credits} + ${plan.dailyFreeCredits}`,
          lastDailyReset: today,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId));

      await this.database.insert(schema.creditTransactions).values({
        id: generateId(),
        userId,
        amount: plan.dailyFreeCredits,
        type: 'daily_free',
        reason: 'Daily free credits',
        metadata: null,
      });
    }
  }

  async ensureMonthlyReset(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    const plan = getPlan(user.planSlug as string);
    if (!isPaidPlan(plan.slug) || plan.monthlyCredits <= 0) return;

    const now = new Date();
    const next = user.nextMonthlyReset ? new Date(user.nextMonthlyReset) : null;
    if (!next || next <= now) {
      // Apply monthly credits with rollover cap
      // new_credits = min(current_credits + monthly_credits, monthly_credits + rollover_limit)
      const maxCarry = plan.monthlyCredits + plan.rolloverLimit;
      // We can't use the formula directly in Drizzle, so compute using SQL CASE
      await this.database.run(sql`UPDATE users
        SET 
          credits = MIN(credits + ${plan.monthlyCredits}, ${maxCarry}),
          next_monthly_reset = ${new Date(Date.now() + plan.resetCycleDays * 24 * 60 * 60 * 1000)},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}`);

      await this.database.insert(schema.creditTransactions).values({
        id: generateId(),
        userId,
        amount: plan.monthlyCredits,
        type: 'monthly_reset',
        reason: 'Monthly plan credits',
        metadata: { plan: plan.slug } as any,
      });
    }
  }

  async ensureCreditsUpToDate(userId: string): Promise<void> {
    await this.ensureDailyReset(userId);
    await this.ensureMonthlyReset(userId);
  }

  async applyTopUp(userId: string, amount: number, reason?: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!Number.isFinite(amount) || amount <= 0) return;
    await this.database.update(schema.users)
      .set({ credits: sql`${schema.users.credits} + ${amount}`, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    await this.database.insert(schema.creditTransactions).values({
      id: generateId(),
      userId,
      amount,
      type: 'topup',
      reason: reason || 'Top-up',
      metadata: (metadata || null) as any,
    });
  }

  async consumeCredits(userId: string, amount: number): Promise<{ ok: boolean; balance?: number; error?: string }> {
    if (!Number.isFinite(amount) || amount <= 0) return { ok: true };
    const user = await this.getUser(userId);
    if (!user) return { ok: false, error: 'User not found' };
    const current = Number(user.credits || 0);
    if (current < amount) {
      return { ok: false, balance: current, error: 'INSUFFICIENT_CREDITS' };
    }
    await this.database.update(schema.users)
      .set({ credits: sql`${schema.users.credits} - ${amount}`, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    await this.database.insert(schema.creditTransactions).values({
      id: generateId(),
      userId,
      amount: -amount,
      type: 'consumption',
      reason: 'Credit consumption',
      metadata: null,
    });
    const after = current - amount;
    return { ok: true, balance: after };
  }

  async setUserPlan(userId: string, planSlug: PlanSlug, whop?: { membershipId?: string; productId?: string; status?: string }): Promise<void> {
    const plan = getPlan(planSlug);
    const updates: Partial<schema.NewUser> & any = {
      planSlug: plan.slug,
      updatedAt: new Date(),
    };
    if (plan.slug === 'free') {
      updates.nextMonthlyReset = null;
      updates.billingStatus = 'none';
    } else {
      // set next reset from now
      updates.nextMonthlyReset = new Date(Date.now() + plan.resetCycleDays * 24 * 60 * 60 * 1000);
      updates.billingStatus = 'active';
    }
    if (whop?.membershipId) updates.whopMembershipId = whop.membershipId;
    if (whop?.productId) updates.whopProductId = whop.productId;
    if (whop?.status) updates.billingStatus = (whop.status as any) || updates.billingStatus;

    await this.database.update(schema.users).set(updates).where(eq(schema.users.id, userId));

    // Optionally grant immediate monthly credits when switching to paid plan
    if (plan.slug !== 'free' && plan.monthlyCredits > 0) {
      await this.applyTopUp(userId, plan.monthlyCredits, 'Initial plan activation');
    }
  }
}