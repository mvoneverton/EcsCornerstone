import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { ProfileBadge } from '../../components/ProfileBadge';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';

interface Position { id: string; title: string }

interface PositionData {
  position: Position;
  summary:  { sent: number; completed: number; pending: number };
  results: {
    id: string; respondentName: string; primaryProfile: string;
    completedAt: string; hasReport: boolean;
  }[];
}

function ReportLink({ resultId, hasReport }: { resultId: string; hasReport: boolean }) {
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    try {
      const { data } = await api.get<{ url?: string; status?: string }>(`/reports/${resultId}/url`);
      if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
  }

  if (!hasReport) return <span className="text-xs text-gray-400">Generating…</span>;

  return (
    <button onClick={open} disabled={loading} className="text-xs font-medium text-accent hover:underline disabled:opacity-50">
      {loading ? 'Opening…' : 'View Report'}
    </button>
  );
}

export default function ManagerDashboard() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout').then((r) => r.data),
    onSettled: () => { clearAuth(); navigate('/login', { replace: true }); },
  });

  const { data: positionsData, isLoading: positionsLoading } = useQuery<{ positions: Position[] }>({
    queryKey: ['manager-positions'],
    queryFn: () => api.get<{ positions: Position[] }>('/manager/positions').then((r) => r.data),
  });

  const positions = positionsData?.positions ?? [];
  const activeId  = selectedId ?? positions[0]?.id ?? null;

  const { data: positionData, isLoading: detailLoading } = useQuery<PositionData>({
    queryKey: ['manager-position', activeId],
    queryFn: () => api.get<PositionData>(`/manager/positions/${activeId}`).then((r) => r.data),
    enabled: !!activeId,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-navy">ECS Cornerstone</span>
          <span className="text-sm text-gray-400">Manager View</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</span>
          <button
            onClick={() => logoutMutation.mutate()}
            className="text-sm font-medium text-accent hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="px-8 py-8 max-w-4xl">
        {positionsLoading ? (
          <div className="h-8 w-48 rounded bg-gray-100 animate-pulse" />
        ) : positions.length === 0 ? (
          <div className="mt-16 text-center">
            <h3 className="text-base font-semibold text-navy">No position assigned yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your administrator hasn't assigned you to a position yet.
            </p>
          </div>
        ) : (
          <>
            {positions.length > 1 && (
              <div className="mb-6">
                <label className="mb-1 block text-xs font-medium text-gray-500">Position</label>
                <select
                  value={activeId ?? ''}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}

            {detailLoading || !positionData ? (
              <div className="h-40 rounded-xl bg-gray-100 animate-pulse" />
            ) : (
              <>
                <h1 className="mb-4 text-2xl font-semibold text-navy">{positionData.position.title}</h1>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="text-sm text-gray-500">Sent</div>
                    <div className="mt-1 text-2xl font-semibold text-navy">{positionData.summary.sent}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="text-sm text-gray-500">Completed</div>
                    <div className="mt-1 text-2xl font-semibold text-navy">{positionData.summary.completed}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="text-sm text-gray-500">Pending</div>
                    <div className="mt-1 text-2xl font-semibold text-navy">{positionData.summary.pending}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Respondent</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</th>
                        <th className="px-6 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {positionData.results.length === 0 && (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No completed assessments yet.</td></tr>
                      )}
                      {positionData.results.map((r) => (
                        <tr key={r.id}>
                          <td className="px-6 py-3 text-sm font-medium text-navy">{r.respondentName}</td>
                          <td className="px-6 py-3"><ProfileBadge primaryProfile={r.primaryProfile} compact /></td>
                          <td className="px-6 py-3 text-sm text-gray-400">{formatDate(r.completedAt)}</td>
                          <td className="px-6 py-3 text-right"><ReportLink resultId={r.id} hasReport={r.hasReport} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
