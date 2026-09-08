import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/admin/PageHeader';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';

interface AnalyticsResponse {
  totalCompanies:            number;
  activeSubscriptions:       number;
  totalAssessmentsCompleted: number;
  assessmentsThisMonth:      number;
  revenueThisMonth:          number;
  topProfiles:      { profile: string; count: number }[];
  recentSignups:    { name: string; createdAt: string }[];
  recentCompletions: { respondentName: string; companyName: string; profile: string; completedAt: string }[];
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-navy">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { data } = useQuery<AnalyticsResponse>({
    queryKey: ['superadmin-analytics'],
    queryFn: () => api.get<AnalyticsResponse>('/superadmin/analytics').then((r) => r.data),
  });

  const topProfile = data?.topProfiles[0];

  return (
    <div className="px-8 py-8 max-w-6xl">
      <PageHeader title="Platform Overview" subtitle="Analytics across all companies" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Total Companies" value={data?.totalCompanies ?? '—'} />
        <StatCard label="Active Subscriptions" value={data?.activeSubscriptions ?? '—'} />
        <StatCard
          label="Assessments This Month"
          value={data?.assessmentsThisMonth ?? '—'}
          sub={data ? `${data.totalAssessmentsCompleted} all-time` : undefined}
        />
        <StatCard
          label="Top Profile"
          value={topProfile?.profile ?? '—'}
          sub={topProfile ? `${topProfile.count} respondents` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent signups */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Signups</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <tbody className="divide-y divide-gray-100">
              {(data?.recentSignups ?? []).map((c, i) => (
                <tr key={i}>
                  <td className="px-6 py-3 text-sm font-medium text-navy">{c.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-400 text-right">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
              {data && data.recentSignups.length === 0 && (
                <tr><td className="px-6 py-6 text-sm text-gray-400 text-center" colSpan={2}>No signups yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent completions */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Completions</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <tbody className="divide-y divide-gray-100">
              {(data?.recentCompletions ?? []).map((c, i) => (
                <tr key={i}>
                  <td className="px-6 py-3">
                    <div className="text-sm font-medium text-navy">{c.respondentName}</div>
                    <div className="text-xs text-gray-400">{c.companyName} · {c.profile}</div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-400 text-right">{formatDate(c.completedAt)}</td>
                </tr>
              ))}
              {data && data.recentCompletions.length === 0 && (
                <tr><td className="px-6 py-6 text-sm text-gray-400 text-center" colSpan={2}>No completions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
