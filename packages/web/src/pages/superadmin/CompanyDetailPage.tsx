import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CompanyDetail {
  company: {
    id: string; name: string; subscriptionStatus: string;
    planId: string | null; planName: string | null;
    currentPeriodEnd: string | null; trialEndsAt: string | null;
    stripeCustomerId: string | null; createdAt: string;
  };
  users: { id: string; firstName: string; lastName: string; email: string; role: string; createdAt: string }[];
  positions: { id: string; title: string; createdAt: string }[];
  recentResults: { id: string; respondentName: string; primaryProfile: string; completedAt: string }[];
  pathTokens: {
    id: string; userId: string | null; pathType: string | null; paths: string[] | null;
    expiresAt: string; usedAt: string | null; deletedAt: string | null; createdAt: string;
  }[];
  auditLog: { id: string; action: string; oldValue: unknown; newValue: unknown; performedBy: string; createdAt: string }[];
}

interface PlanOption { id: string; name: string }

const TABS = ['Overview', 'Gated Services', 'Assessments', 'Users', 'Audit Log'] as const;
type Tab = typeof TABS[number];

function statusBadgeVariant(status: string): 'green' | 'blue' | 'amber' | 'red' | 'gray' {
  if (status === 'active') return 'green';
  if (status === 'trialing') return 'blue';
  if (status === 'past_due') return 'amber';
  if (status === 'canceled') return 'red';
  return 'gray';
}

function actionLabel(action: string): string {
  return action.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Overview tab ───────────────────────────────────────────────────────────────

function OverviewTab({ companyId, detail }: { companyId: string; detail: CompanyDetail }) {
  const queryClient = useQueryClient();
  const [planId, setPlanId] = useState(detail.company.planId ?? '');
  const [status, setStatus] = useState(detail.company.subscriptionStatus);

  const { data: plansData } = useQuery<{ plans: PlanOption[] }>({
    queryKey: ['onboarding-plans'],
    queryFn: () => api.get<{ plans: PlanOption[] }>('/onboarding/plans').then((r) => r.data),
  });

  const planMutation = useMutation({
    mutationFn: () => api.patch(`/superadmin/companies/${companyId}/plan`, { planId }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin-company', companyId] }),
  });

  const statusMutation = useMutation({
    mutationFn: () => api.patch(`/superadmin/companies/${companyId}/subscription-status`, { status }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin-company', companyId] }),
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Company Info</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd className="text-navy font-medium">{detail.company.name}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Current period end</dt><dd>{detail.company.currentPeriodEnd ? formatDate(detail.company.currentPeriodEnd) : '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Trial ends</dt><dd>{detail.company.trialEndsAt ? formatDate(detail.company.trialEndsAt) : '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Stripe customer</dt><dd className="font-mono text-xs">{detail.company.stripeCustomerId ?? '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Joined</dt><dd>{formatDate(detail.company.createdAt)}</dd></div>
        </dl>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Plan</h3>
        <div className="flex items-center gap-2 mb-4">
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {(plansData?.plans ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <Button size="sm" onClick={() => planMutation.mutate()} loading={planMutation.isPending} disabled={!planId || planId === detail.company.planId}>
            Save
          </Button>
        </div>

        <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Subscription Status</h3>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past due</option>
            <option value="canceled">Cancelled</option>
            <option value="incomplete">Incomplete</option>
          </select>
          <Button size="sm" onClick={() => statusMutation.mutate()} loading={statusMutation.isPending} disabled={status === detail.company.subscriptionStatus}>
            Save
          </Button>
        </div>
        <div className="mt-3">
          <Badge variant={statusBadgeVariant(detail.company.subscriptionStatus)}>{detail.company.subscriptionStatus}</Badge>
        </div>
      </div>
    </div>
  );
}

// ── Gated Services tab ─────────────────────────────────────────────────────────

function GatedServiceCard({
  companyId, pathType, label, tokens, history,
}: {
  companyId: string; pathType: 'agent_placement' | 'fcaio'; label: string;
  tokens: CompanyDetail['pathTokens']; history: CompanyDetail['auditLog'];
}) {
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState<{ tokenPreview: string; expiresAt: string } | null>(null);

  const activeToken = tokens
    .filter((t) => t.pathType === pathType && !t.deletedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const isExpired  = activeToken && new Date(activeToken.expiresAt) < new Date();
  const status     = !activeToken ? 'locked' : isExpired ? 'expired' : 'unlocked';

  const relevantHistory = history.filter((h) =>
    (h.action === 'path.unlocked' || h.action === 'path.revoked') &&
    JSON.stringify(h.newValue).includes(pathType)
  );

  const unlockMutation = useMutation({
    mutationFn: () => api.post<{ expiresAt: string; tokenPreview: string }>(
      `/superadmin/companies/${companyId}/unlock-path`, { path: pathType }
    ).then((r) => r.data),
    onSuccess: (data) => {
      setConfirmation(data);
      queryClient.invalidateQueries({ queryKey: ['superadmin-company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-companies'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: () => api.delete(`/superadmin/companies/${companyId}/revoke-path`, { data: { path: pathType } }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-companies'] });
    },
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-navy">{label}</h3>
        <Badge variant={status === 'unlocked' ? 'green' : status === 'expired' ? 'amber' : 'gray'}>
          {status === 'unlocked' ? 'Unlocked' : status === 'expired' ? 'Expired' : 'Locked'}
        </Badge>
      </div>

      {activeToken && !isExpired && (
        <p className="mb-4 text-xs text-gray-500">Expires {formatDate(activeToken.expiresAt)}</p>
      )}

      {confirmation && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Unlocked — token {confirmation.tokenPreview}, expires {formatDate(confirmation.expiresAt)}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <Button size="sm" onClick={() => unlockMutation.mutate()} loading={unlockMutation.isPending}>
          Unlock & Send Email
        </Button>
        {status === 'unlocked' && (
          <Button
            size="sm" variant="secondary"
            onClick={() => revokeMutation.mutate()}
            loading={revokeMutation.isPending}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Revoke Access
          </Button>
        )}
      </div>

      {relevantHistory.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Activity</h4>
          <ul className="space-y-1.5">
            {relevantHistory.slice(0, 5).map((h) => (
              <li key={h.id} className="text-xs text-gray-500">
                {actionLabel(h.action)} by {h.performedBy} · {formatDate(h.createdAt)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GatedServicesTab({ companyId, detail }: { companyId: string; detail: CompanyDetail }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <GatedServiceCard companyId={companyId} pathType="agent_placement" label="Agent Placement" tokens={detail.pathTokens} history={detail.auditLog} />
      <GatedServiceCard companyId={companyId} pathType="fcaio" label="FCAIO" tokens={detail.pathTokens} history={detail.auditLog} />
    </div>
  );
}

// ── Assessments tab ────────────────────────────────────────────────────────────

function ReportCell({ resultId }: { resultId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ url?: string; status?: string }>(`/reports/${resultId}/url`);
      if (data.status === 'generating') { setError('Generating…'); return; }
      if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Failed');
    } finally {
      setLoading(false);
    }
  }

  const regenerateMutation = useMutation({
    mutationFn: () => api.post(`/reports/${resultId}/regenerate`).then((r) => r.data),
  });

  return (
    <div className="flex items-center gap-3">
      <button onClick={download} disabled={loading} className="text-xs font-medium text-accent hover:underline disabled:opacity-50">
        {loading ? 'Opening…' : error ?? 'Download'}
      </button>
      <button
        onClick={() => regenerateMutation.mutate()}
        disabled={regenerateMutation.isPending}
        className="text-xs font-medium text-gray-400 hover:text-gray-600 disabled:opacity-50"
      >
        {regenerateMutation.isPending ? 'Regenerating…' : regenerateMutation.isSuccess ? 'Queued' : 'Regenerate'}
      </button>
    </div>
  );
}

function AssessmentsTab({ detail }: { detail: CompanyDetail }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Respondent</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Report</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {detail.recentResults.length === 0 && (
            <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No results yet.</td></tr>
          )}
          {detail.recentResults.map((r) => (
            <tr key={r.id}>
              <td className="px-6 py-3 text-sm font-medium text-navy">{r.respondentName}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{r.primaryProfile}</td>
              <td className="px-6 py-3 text-sm text-gray-400">{formatDate(r.completedAt)}</td>
              <td className="px-6 py-3"><ReportCell resultId={r.id} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Users tab ──────────────────────────────────────────────────────────────────

function UsersTab({ detail }: { detail: CompanyDetail }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {detail.users.map((u) => (
            <tr key={u.id}>
              <td className="px-6 py-3 text-sm font-medium text-navy">{u.firstName} {u.lastName}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{u.email}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{u.role}</td>
              <td className="px-6 py-3 text-sm text-gray-400">{formatDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Audit Log tab ──────────────────────────────────────────────────────────────

function AuditLogTab({ detail }: { detail: CompanyDetail }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Old Value</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">New Value</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Performed By</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {detail.auditLog.length === 0 && (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No activity yet.</td></tr>
          )}
          {detail.auditLog.map((l) => (
            <tr key={l.id}>
              <td className="px-6 py-3 text-sm font-medium text-navy">{actionLabel(l.action)}</td>
              <td className="px-6 py-3 text-xs font-mono text-gray-500">{l.oldValue ? JSON.stringify(l.oldValue) : '—'}</td>
              <td className="px-6 py-3 text-xs font-mono text-gray-500">{l.newValue ? JSON.stringify(l.newValue) : '—'}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{l.performedBy}</td>
              <td className="px-6 py-3 text-sm text-gray-400">{formatDate(l.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [tab, setTab] = useState<Tab>('Overview');

  const { data, isLoading } = useQuery<CompanyDetail>({
    queryKey: ['superadmin-company', companyId],
    queryFn: () => api.get<CompanyDetail>(`/superadmin/companies/${companyId}`).then((r) => r.data),
    enabled: !!companyId,
  });

  if (isLoading) {
    return <div className="px-8 py-8"><div className="h-8 w-48 rounded bg-gray-100 animate-pulse" /></div>;
  }

  if (!data || !companyId) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm text-gray-500">Company not found.</p>
        <Link to="/superadmin/companies" className="mt-2 inline-block text-sm text-accent hover:underline">
          Back to companies
        </Link>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <PageHeader
        title={data.company.name}
        subtitle={data.company.planName ?? undefined}
        actions={<Link to="/superadmin/companies"><Button variant="secondary" size="md">Back</Button></Link>}
      />

      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-gold text-navy' : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview'       && <OverviewTab companyId={companyId} detail={data} />}
      {tab === 'Gated Services' && <GatedServicesTab companyId={companyId} detail={data} />}
      {tab === 'Assessments'    && <AssessmentsTab detail={data} />}
      {tab === 'Users'          && <UsersTab detail={data} />}
      {tab === 'Audit Log'      && <AuditLogTab detail={data} />}
    </div>
  );
}
