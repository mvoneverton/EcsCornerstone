import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '../../components/admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubscriptionData {
  subscriptionStatus: string;
  plan: {
    name:            string;
    assessmentLimit: number | null;
    priceMonthly:    number | null;
  };
  usageThisMonth: number;
  currentPeriodEnd: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusVariant(status: string): 'green' | 'amber' | 'red' | 'gray' {
  if (status === 'active')   return 'green';
  if (status === 'trialing') return 'amber';
  if (status === 'past_due') return 'red';
  return 'gray';
}

function statusLabel(status: string): string {
  if (status === 'active')    return 'Active';
  if (status === 'trialing')  return 'Trial';
  if (status === 'past_due')  return 'Past due';
  if (status === 'canceled')  return 'Canceled';
  if (status === 'inactive')  return 'Inactive';
  return status;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatPeriodEnd(isoDate: string | null): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'long',
    day:   'numeric',
    year:  'numeric',
  });
}

// ── Usage bar ─────────────────────────────────────────────────────────────────

function UsageBar({ used, limit }: { used: number; limit: number | null }) {
  if (limit === null) {
    return (
      <div className="mt-1">
        <span className="text-2xl font-bold text-navy">{used}</span>
        <span className="ml-1 text-sm text-gray-500">this month · unlimited</span>
      </div>
    );
  }

  const pct     = Math.min(100, Math.round((used / limit) * 100));
  const nearCap = pct >= 80;
  const atCap   = pct >= 100;

  return (
    <div className="mt-1">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-navy">{used}</span>
        <span className="text-sm text-gray-500">/ {limit} this month</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            atCap ? 'bg-red-500' : nearCap ? 'bg-amber-400' : 'bg-accent'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {atCap && (
        <p className="mt-1 text-xs text-red-600">
          Limit reached. Upgrade to send more assessments this month.
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Billing() {
  const { data, isLoading } = useQuery<SubscriptionData>({
    queryKey: ['subscription'],
    queryFn: () => api.get<SubscriptionData>('/billing/subscription').then((r) => r.data),
  });

  const portalMutation = useMutation({
    mutationFn: () =>
      api.post<{ url: string }>('/billing/portal').then((r) => r.data),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });

  return (
    <div className="px-8 py-8">
      <PageHeader title="Billing" />

      <div className="max-w-2xl space-y-6">
        {/* Current plan */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-navy">Current Plan</h2>

          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-5 rounded bg-gray-100 animate-pulse" style={{ width: i === 0 ? '160px' : '240px' }} />
              ))}
            </div>
          )}

          {data && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold text-navy">{data.plan.name}</span>
                <Badge variant={statusVariant(data.subscriptionStatus)}>
                  {statusLabel(data.subscriptionStatus)}
                </Badge>
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Monthly price</dt>
                  <dd className="font-medium text-navy">
                    {data.plan.priceMonthly !== null
                      ? `${formatCurrency(data.plan.priceMonthly)} / mo`
                      : 'Custom pricing'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Assessment limit</dt>
                  <dd className="font-medium text-navy">
                    {data.plan.assessmentLimit !== null
                      ? `${data.plan.assessmentLimit} / month`
                      : 'Unlimited'}
                  </dd>
                </div>
                {data.currentPeriodEnd && (
                  <div>
                    <dt className="text-gray-500">Renews</dt>
                    <dd className="font-medium text-navy">{formatPeriodEnd(data.currentPeriodEnd)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </section>

        {/* Usage */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-2 text-base font-semibold text-navy">Assessments Sent</h2>

          {isLoading && (
            <div className="h-8 w-32 rounded bg-gray-100 animate-pulse" />
          )}

          {data && (
            <UsageBar
              used={data.usageThisMonth}
              limit={data.plan.assessmentLimit}
            />
          )}
        </section>

        {/* Manage via Stripe */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-2 text-base font-semibold text-navy">Manage Subscription</h2>
          <p className="mb-4 text-sm text-gray-500">
            Update your payment method, download invoices, or change your plan in the Stripe
            customer portal.
          </p>

          {portalMutation.isError && (
            <p className="mb-3 text-sm text-red-600">
              Could not open billing portal. Please try again.
            </p>
          )}

          <Button
            size="md"
            onClick={() => portalMutation.mutate()}
            loading={portalMutation.isPending}
          >
            Open billing portal
            <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Button>
        </section>
      </div>
    </div>
  );
}
