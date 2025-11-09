import React from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function BillingWidget() {
  const [loading, setLoading] = React.useState(true);
  const [me, setMe] = React.useState<{ plan: string; credits: number; lastDailyReset: string | null; nextMonthlyReset: string | null; billingStatus: string } | null>(null);
  const [plans, setPlans] = React.useState<Array<{ slug: string; name: string; monthlyCredits: number; dailyFreeCredits: number; rolloverLimit: number; resetCycleDays: number; priceUsd: number; checkoutUrl?: string | null }>>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [meRes, plansRes] = await Promise.all([
          apiClient.getBillingMe(),
          apiClient.getBillingPlans(),
        ]);
        if (mounted) {
          if (meRes.success && meRes.data) setMe(meRes.data as any);
          if (plansRes.success && plansRes.data) setPlans((plansRes.data as any).plans);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-text-tertiary">Loading billing...</div>
        ) : me ? (
          <div className="space-y-3">
            <div className="text-sm">Plan: <strong className="uppercase">{me.plan}</strong> <span className="text-text-tertiary">({me.billingStatus})</span></div>
            <div className="text-sm">Credits: <strong>{me.credits}</strong></div>
            {me.nextMonthlyReset && (
              <div className="text-xs text-text-tertiary">Next monthly reset: {new Date(me.nextMonthlyReset).toLocaleString()}</div>
            )}
            <div className="flex gap-2 mt-2 flex-wrap">
              {plans.filter(p => p.slug !== 'free').map(p => (
                <a key={p.slug} href={p.checkoutUrl || '#'} target={p.checkoutUrl ? '_blank' : undefined} rel="noreferrer">
                  <Button variant={p.slug === me.plan ? 'outline' : 'default'} disabled={!p.checkoutUrl}>
                    {p.slug === me.plan ? 'Current: ' : 'Upgrade to '}{p.name} (${p.priceUsd}/mo)
                  </Button>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-destructive">Failed to load billing</div>
        )}
      </CardContent>
    </Card>
  );
}