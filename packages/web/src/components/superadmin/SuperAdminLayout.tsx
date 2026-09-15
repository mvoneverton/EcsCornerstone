import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';

const cornerstoneNavItems = [
  { to: '/superadmin',            label: 'Dashboard',  end: true },
  { to: '/superadmin/companies',  label: 'Companies',  end: false },
  { to: '/superadmin/audit-log',  label: 'Audit Log',  end: true },
];

const pfNavItems = [
  { to: '/superadmin/people-first/events',  label: 'Events',  end: false },
  { to: '/superadmin/people-first/results', label: 'Results', end: false },
];

const activeClass   = 'bg-white/10 text-white';
const inactiveClass = 'text-navy-200 hover:bg-white/5 hover:text-white';
const base          = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';

export function SuperAdminLayout() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();

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
      <aside className="flex w-60 flex-shrink-0 flex-col bg-navy overflow-y-auto">
        <div className="flex h-16 flex-shrink-0 items-center gap-3 px-4 border-b border-white/10">
          <img src="/ecs-logo.svg" alt="ECS Cornerstone" className="h-10 w-auto flex-shrink-0" />
          <div className="leading-tight">
            <div className="text-sm font-light text-navy-200">ECS Cornerstone</div>
            <div className="text-xs font-medium text-gold">Super Admin</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {cornerstoneNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${base} ${isActive ? activeClass : inactiveClass}`}
            >
              {item.label}
            </NavLink>
          ))}

          <div className="mt-4 mb-1 border-t border-white/10 pt-4">
            <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-navy-300">
              People First
            </div>
          </div>

          {pfNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${base} ${isActive ? activeClass : inactiveClass}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-shrink-0 border-t border-white/10 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold text-navy text-xs font-semibold">
              {`${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()}
            </div>
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

      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
