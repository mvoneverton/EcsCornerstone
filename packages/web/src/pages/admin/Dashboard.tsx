import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { ProfileBadge } from '../../components/ProfileBadge';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';

interface DashboardResponse {
  company: {
    name: string | null;
    plan: string | null;
    subscriptionStatus: string | null;
    assessmentsUsed: number;
    assessmentLimit: number | null;
  };
  stats: {
    totalInvitations: number;
    completedAssessments: number;
    pendingInvitations: number;
    completionRate: number;
    profileBreakdown: { profile: string; count: number }[];
  };
  recentResults: {
    id: string;
    respondentName: string;
    respondentEmail: string;
    positionTitle: string | null;
    primaryProfile: string;
    completedAt: string;
    hasReport: boolean;
  }[];
  activePositions: { id: string; title: string; pendingCount: number }[];
}

const PROFILE_COLORS: Record<string, { bg: string; text: string }> = {
  Catalyst:   { bg: 'bg-catalyst-bg',   text: 'text-catalyst-text'   },
  Vanguard:   { bg: 'bg-vanguard-bg',   text: 'text-vanguard-text'   },
  Cultivator: { bg: 'bg-cultivator-bg', text: 'text-cultivator-text' },
  Architect:  { bg: 'bg-architect-bg',  text: 'text-architect-text'  },
};

function StatCard({ label, value, sub, progress }: {
  label: string; value: string | number; sub?: string; progress?: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-navy">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-gold transition-all"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const { data } = useQuery<DashboardResponse>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get<DashboardResponse>('/admin/dashboard').then((r) => r.data),
  });

  const topProfile = data?.stats.profileBreakdown.reduce(
    (top, p) => (!top || p.count > top.count ? p : top),
    null as { profile: string; count: number } | null
  );

  const usagePct = data?.company.assessmentLimit
    ? Math.round((data.company.assessmentsUsed / data.company.assessmentLimit) * 100)
    : undefined;

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-navy">
          Welcome back, {user?.firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's an overview of your ECS Cornerstone workspace.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
        <StatCard
          label="Assessments"
          value={data ? `${data.company.assessmentsUsed}${data.company.assessmentLimit ? ` / ${data.company.assessmentLimit}` : ''}` : '—'}
          sub={data?.company.assessmentLimit ? 'Used this month' : 'Unlimited plan'}
          progress={usagePct}
        />
        <StatCard
          label="Pending invitations"
          value={data?.stats.pendingInvitations ?? '—'}
        />
        <StatCard
          label="Completion rate"
          value={data ? `${data.stats.completionRate}%` : '—'}
          sub={data ? `${data.stats.completedAssessments} of ${data.stats.totalInvitations} completed` : undefined}
        />
        <StatCard
          label="Most common profile"
          value={topProfile?.profile ?? '—'}
          sub={topProfile ? `${topProfile.count} respondent${topProfile.count === 1 ? '' : 's'}` : undefined}
        />
      </div>

      {/* Profile breakdown */}
      {data && data.stats.profileBreakdown.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {data.stats.profileBreakdown.map((p) => {
            const colors = PROFILE_COLORS[p.profile] ?? { bg: 'bg-gray-50', text: 'text-gray-700' };
            return (
              <div key={p.profile} className={`rounded-lg p-4 ${colors.bg}`}>
                <div className={`text-2xl font-bold ${colors.text}`}>{p.count}</div>
                <div className={`mt-0.5 text-sm font-medium ${colors.text}`}>{p.profile}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/people/invite"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Send new assessment
          </Link>
          <Link
            to="/admin/people"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View all people
          </Link>
          <Link
            to="/admin/results"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View results
          </Link>
        </div>
      </div>

      {/* Recent results */}
      {data && data.recentResults.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent results</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <tbody className="divide-y divide-gray-100">
              {data.recentResults.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/admin/results/${r.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="text-sm font-medium text-navy">{r.respondentName}</div>
                    <div className="text-xs text-gray-400">{r.positionTitle ?? r.respondentEmail}</div>
                  </td>
                  <td className="px-6 py-3">
                    <ProfileBadge primaryProfile={r.primaryProfile} compact />
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-400">{formatDate(r.completedAt)}</td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-xs font-medium text-accent hover:underline">
                      {r.hasReport ? 'View report' : 'Generating…'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
