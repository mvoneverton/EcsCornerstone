import { Outlet, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { SidebarNav } from './SidebarNav';
import api from '../../lib/api';

interface CompanyInfo {
  id:                 string;
  name:               string;
  subscriptionStatus: string;
  plan: {
    name:            string;
    assessmentLimit: number | null;
  };
}

function UserAvatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-white text-xs font-semibold">
      {initials}
    </div>
  );
}

export function AdminLayout() {
  const { user, clearAuth } = useAuth();
  const navigate            = useNavigate();

  const { data: company } = useQuery<CompanyInfo>({
    queryKey: ['company'],
    queryFn: () => api.get<CompanyInfo>('/admin/company').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout').then((r) => r.data),
    onSettled: () => {
      clearAuth();
      navigate('/login', { replace: true });
    },
  });

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="flex w-60 flex-shrink-0 flex-col bg-navy overflow-y-auto">

        {/* Logo */}
        <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-white/10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-semibold text-white">ECS</span>
            <span className="text-lg font-light text-navy-200">Cornerstone</span>
          </div>
        </div>

        {/* Company name */}
        {company && (
          <div className="px-4 pt-4 pb-2">
            <div className="text-xs font-medium text-navy-300 uppercase tracking-wider">Workspace</div>
            <div className="mt-1 text-sm font-medium text-white truncate">{company.name}</div>
            <div className="mt-0.5 text-xs text-navy-300">{company.plan.name} plan</div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-1 flex-col px-3 overflow-y-auto">
          <SidebarNav />
        </div>

        {/* User section at bottom */}
        <div className="flex-shrink-0 border-t border-white/10 p-3">
          <div className="flex items-center gap-3">
            <UserAvatar firstName={user.firstName} lastName={user.lastName} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-navy-300 truncate">{user.email}</div>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              title="Sign out"
              className="flex-shrink-0 rounded p-1 text-navy-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top header */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="text-sm text-gray-500">
            {company?.name ?? ''}
          </div>
          <div className="flex items-center gap-3">
            {company && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                company.subscriptionStatus === 'active' || company.subscriptionStatus === 'trialing'
                  ? 'bg-green-50 text-green-700'
                  : company.subscriptionStatus === 'past_due'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {company.subscriptionStatus === 'active'   ? 'Active'
                : company.subscriptionStatus === 'trialing' ? 'Trial'
                : company.subscriptionStatus === 'past_due' ? 'Past due'
                : company.subscriptionStatus}
              </span>
            )}
            <div className="flex items-center gap-2">
              <UserAvatar firstName={user.firstName} lastName={user.lastName} />
              <span className="text-sm font-medium text-gray-700">
                {user.firstName} {user.lastName}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
