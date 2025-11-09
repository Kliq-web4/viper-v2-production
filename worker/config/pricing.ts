import { z } from 'zod';

// Plan definition
export type PlanSlug = 'free' | 'pro' | 'business';

export interface Plan {
  slug: PlanSlug;
  name: string;
  monthlyCredits: number; // monthly_credits
  dailyFreeCredits: number; // daily_free_credits
  rolloverLimit: number; // rollover_limit
  resetCycleDays: number; // reset_cycle_days
  priceUsd: number; // price ($)
}

export const PLANS: Record<PlanSlug, Plan> = {
  free: {
    slug: 'free',
    name: 'Free',
    monthlyCredits: 0,
    dailyFreeCredits: 10,
    rolloverLimit: 0,
    resetCycleDays: 1,
    priceUsd: 0,
  },
  pro: {
    slug: 'pro',
    name: 'Pro',
    monthlyCredits: 100,
    dailyFreeCredits: 0,
    rolloverLimit: 100,
    resetCycleDays: 30,
    priceUsd: 25,
  },
  business: {
    slug: 'business',
    name: 'Business',
    monthlyCredits: 500,
    dailyFreeCredits: 0,
    rolloverLimit: 500,
    resetCycleDays: 30,
    priceUsd: 79,
  },
};

export function getPlan(slug?: string | null): Plan {
  const s = (slug || 'free') as PlanSlug;
  return PLANS[s] || PLANS.free;
}

export function isPaidPlan(slug?: string | null): boolean {
  const s = (slug || 'free') as PlanSlug;
  return s === 'pro' || s === 'business';
}

export const COSTS = {
  startGeneration: 1,
};

// Optional mapping to Whop product/price IDs via environment
// These can be configured in environment variables and consumed by the webhook handler
export function getWhopPlanMap(env: Env): Record<string, PlanSlug> {
  // Map of whop product/price identifiers to our plan slugs
  const map: Record<string, PlanSlug> = {};
  // Support multiple env var names for flexibility
  // e.g., WHOP_PRO_PRODUCT_ID or WHOP_PRO_PRICE_ID
  if (env.WHOP_PRO_PRODUCT_ID) map[env.WHOP_PRO_PRODUCT_ID] = 'pro';
  if (env.WHOP_PRO_PRICE_ID) map[env.WHOP_PRO_PRICE_ID] = 'pro';
  if (env.WHOP_BUSINESS_PRODUCT_ID) map[env.WHOP_BUSINESS_PRODUCT_ID] = 'business';
  if (env.WHOP_BUSINESS_PRICE_ID) map[env.WHOP_BUSINESS_PRICE_ID] = 'business';
  return map;
}

export const WhopWebhookSchema = z.object({
  // Flexible schema: adapt field names to your Whop setup
  event: z.string(),
  id: z.string().optional(),
  data: z.any().optional(),
});