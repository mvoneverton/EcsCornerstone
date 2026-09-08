import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';

interface AuditEntry {
  id:          string;
  action:      string;
  oldValue:    unknown;
  newValue:    unknown;
  companyName: string | null;
  performedBy: string;
  createdAt:   string;
}

interface AuditLogResponse {
  entries: AuditEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

function actionLabel(action: string): string {
  return action.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<AuditLogResponse>({
    queryKey: ['superadmin-audit-log', page],
    queryFn: () => api.get<AuditLogResponse>(`/superadmin/audit-log?page=${page}&limit=50`).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const entries    = data?.entries ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 1 };

  return (
    <div className="px-8 py-8">
      <PageHeader title="Audit Log" subtitle="Platform-wide super admin activity" />

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Old Value</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">New Value</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Performed By</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">Loading…</td></tr>
            )}
            {!isLoading && entries.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">No activity yet.</td></tr>
            )}
            {!isLoading && entries.map((e) => (
              <tr key={e.id}>
                <td className="px-6 py-3 text-sm font-medium text-navy">{actionLabel(e.action)}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{e.companyName ?? '—'}</td>
                <td className="px-6 py-3 text-xs font-mono text-gray-500 max-w-[160px] truncate">
                  {e.oldValue ? JSON.stringify(e.oldValue) : '—'}
                </td>
                <td className="px-6 py-3 text-xs font-mono text-gray-500 max-w-[160px] truncate">
                  {e.newValue ? JSON.stringify(e.newValue) : '—'}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{e.performedBy}</td>
                <td className="px-6 py-3 text-sm text-gray-400">{formatDate(e.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} entries
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
