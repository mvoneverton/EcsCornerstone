import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '../../components/admin/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';

interface Company {
  id:                 string;
  name:               string;
  subscriptionStatus: string;
  planName:           string | null;
  adminEmail:         string | null;
  assessmentCount:    number;
  createdAt:          string;
  gatedServices: { agentPlacement: boolean; fcaio: boolean };
}

function statusBadge(status: string): { variant: 'green' | 'blue' | 'amber' | 'red' | 'gray'; label: string } {
  switch (status) {
    case 'active':   return { variant: 'green', label: 'Active' };
    case 'trialing': return { variant: 'blue',  label: 'Trial' };
    case 'past_due': return { variant: 'amber', label: 'Past due' };
    case 'canceled': return { variant: 'red',   label: 'Cancelled' };
    default:         return { variant: 'gray',  label: status };
  }
}

function GatedIcon({ unlocked }: { unlocked: boolean }) {
  return (
    <span
      title={unlocked ? 'Unlocked' : 'Locked'}
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
        unlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
      }`}
    >
      {unlocked ? (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4m-9 0h10a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1z" />
        </svg>
      ) : (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )}
    </span>
  );
}

export default function CompaniesListPage() {
  const navigate = useNavigate();
  const { startImpersonation } = useAuth();

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery<{ companies: Company[] }>({
    queryKey: ['superadmin-companies'],
    queryFn: () => api.get<{ companies: Company[] }>('/superadmin/companies').then((r) => r.data),
  });

  const impersonateMutation = useMutation({
    mutationFn: (companyId: string) =>
      api.post<{ accessToken: string; user: Parameters<typeof startImpersonation>[0] }>(
        `/superadmin/impersonate/${companyId}`
      ).then((r) => r.data),
    onSuccess: (data) => {
      startImpersonation(data.user, data.accessToken);
      navigate('/admin');
    },
  });

  const companies = (data?.companies ?? []).filter((c) => {
    if (statusFilter && c.subscriptionStatus !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="px-8 py-8">
      <PageHeader title="Companies" subtitle={`${companies.length} total`} />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">Search</label>
          <Input
            type="search"
            placeholder="Search by company name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trial</option>
            <option value="past_due">Past due</option>
            <option value="canceled">Cancelled</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessments</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Gated Services</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-400">Loading…</td></tr>
            )}
            {!isLoading && companies.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">No companies match your filters.</td></tr>
            )}
            {!isLoading && companies.map((c) => {
              const status = statusBadge(c.subscriptionStatus);
              return (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/superadmin/companies/${c.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-navy">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.planName ?? '—'}</td>
                  <td className="px-6 py-4"><Badge variant={status.variant}>{status.label}</Badge></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.assessmentCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <GatedIcon unlocked={c.gatedServices.agentPlacement} />
                      <GatedIcon unlocked={c.gatedServices.fcaio} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.adminEmail ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{formatDate(c.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/superadmin/companies/${c.id}`); }}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        View Details
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); impersonateMutation.mutate(c.id); }}
                        disabled={impersonateMutation.isPending}
                        className="text-xs font-medium text-gold-500 hover:underline disabled:opacity-50"
                      >
                        Impersonate
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
