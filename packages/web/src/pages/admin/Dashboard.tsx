import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';

interface CompanyInfo {
  name: string;
  subscriptionStatus: string;
  plan: { name: string; assessmentLimit: number | null };
}

interface PeopleList {
  total: number;
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

export default function Dashboard() {
  const { user } = useAuth();

  const { data: company } = useQuery<CompanyInfo>({
    queryKey: ['company'],
    queryFn: () => api.get<CompanyInfo>('/admin/company').then((r) => r.data),
  });

  const { data: people } = useQuery<PeopleList>({
    queryKey: ['people', { page: 1, limit: 1 }],
    queryFn: () => api.get<PeopleList>('/admin/people?page=1&limit=1').then((r) => r.data),
  });

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <StatCard
          label="People"
          value={people?.total ?? '—'}
          sub="Total respondents"
        />
        <StatCard
          label="Plan"
          value={company?.plan.name ?? '—'}
          sub={
            company?.plan.assessmentLimit
              ? `${company.plan.assessmentLimit} assessments / month`
              : 'Unlimited assessments'
          }
        />
        <StatCard
          label="Subscription"
          value={
            company?.subscriptionStatus === 'active'   ? 'Active'
            : company?.subscriptionStatus === 'trialing' ? 'Trial'
            : company?.subscriptionStatus === 'past_due' ? 'Past due'
            : company?.subscriptionStatus ?? '—'
          }
          sub={company?.name}
        />
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/people/invite"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Invite someone
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
    </div>
  );
}
