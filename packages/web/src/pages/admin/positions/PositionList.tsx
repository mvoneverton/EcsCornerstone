import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../../components/admin/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatDate } from '../../../lib/utils';
import api from '../../../lib/api';

interface Position {
  id:                   string;
  title:                string;
  status:               'draft' | 'consensus_pending' | 'finalized';
  consensusAPercentile: number | null;
  consensusRPercentile: number | null;
  finalizedAt:          string | null;
  createdAt:            string;
  jaCount:              number;
  completedCount:       number;
}

interface PositionsResponse {
  positions: Position[];
}

function statusVariant(status: string): 'gray' | 'amber' | 'green' {
  if (status === 'finalized')         return 'green';
  if (status === 'consensus_pending') return 'amber';
  return 'gray';
}

function statusLabel(status: string): string {
  if (status === 'finalized')         return 'Finalized';
  if (status === 'consensus_pending') return 'Pending';
  return 'Draft';
}

export default function PositionList() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<PositionsResponse>({
    queryKey: ['positions'],
    queryFn: () => api.get<PositionsResponse>('/admin/positions').then((r) => r.data),
  });

  const positions = data?.positions ?? [];

  return (
    <div className="px-8 py-8">
      <PageHeader
        title="Positions"
        subtitle={positions.length > 0 ? `${positions.length} total` : undefined}
        actions={
          <Link to="/admin/positions/new">
            <Button size="md">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New position
            </Button>
          </Link>
        }
      />

      {!isLoading && positions.length === 0 && (
        <div className="mt-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-navy">No positions yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a position to define a job benchmark and collect JA assessments.
          </p>
          <Link to="/admin/positions/new" className="mt-4 inline-block">
            <Button size="md">Create your first position</Button>
          </Link>
        </div>
      )}

      {(isLoading || positions.length > 0) && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">JA Responses</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Consensus A / R</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: j === 0 ? '160px' : '80px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {!isLoading && positions.map((pos) => (
                <tr
                  key={pos.id}
                  onClick={() => navigate(`/admin/positions/${pos.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-navy">{pos.title}</td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariant(pos.status)}>{statusLabel(pos.status)}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {pos.completedCount} / {pos.jaCount} completed
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {pos.consensusAPercentile !== null
                      ? `${Math.round(pos.consensusAPercentile)}% / ${Math.round(pos.consensusRPercentile ?? 0)}%`
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{formatDate(pos.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
