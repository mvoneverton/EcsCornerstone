import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../../components/admin/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatDate } from '../../../lib/utils';
import api from '../../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface JaInvitation {
  id:             string;
  respondentId:   string;
  firstName:      string;
  lastName:       string;
  email:          string;
  sentAt:         string;
  openedAt:       string | null;
  completedAt:    string | null;
  expiresAt:      string;
  aPercentile:    number | null;
  rPercentile:    number | null;
  aScore800:      number | null;
  rScore800:      number | null;
  primaryProfile: string | null;
  status:         'completed' | 'pending' | 'expired';
}

interface PositionData {
  id:                   string;
  title:                string;
  status:               'draft' | 'consensus_pending' | 'finalized';
  consensusAPercentile: number | null;
  consensusRPercentile: number | null;
  finalizedAt:          string | null;
  createdAt:            string;
}

interface PositionDetailResponse {
  position:    PositionData;
  invitations: JaInvitation[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusVariant(status: string): 'gray' | 'amber' | 'green' | 'red' {
  if (status === 'completed') return 'green';
  if (status === 'pending')   return 'amber';
  if (status === 'expired')   return 'red';
  return 'gray';
}

function positionStatusLabel(status: string): string {
  if (status === 'finalized')         return 'Finalized';
  if (status === 'consensus_pending') return 'Pending consensus';
  return 'Draft';
}

// ── Consensus card ────────────────────────────────────────────────────────────

function ConsensusCard({
  position,
  completedCount,
  onFinalize,
  finalizing,
  finalizeError,
}: {
  position:      PositionData;
  completedCount: number;
  onFinalize:    () => void;
  finalizing:    boolean;
  finalizeError: string | null;
}) {
  if (position.status === 'finalized') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider mb-2">
              Consensus Benchmark
            </h3>
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-bold text-emerald-700">
                  {Math.round(position.consensusAPercentile ?? 0)}%
                </div>
                <div className="text-xs text-emerald-600">Assertiveness (A)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700">
                  {Math.round(position.consensusRPercentile ?? 0)}%
                </div>
                <div className="text-xs text-emerald-600">Relationship (R)</div>
              </div>
            </div>
            {position.finalizedAt && (
              <p className="mt-2 text-xs text-emerald-600">
                Finalized {formatDate(position.finalizedAt)} · based on {completedCount} assessor{completedCount === 1 ? '' : 's'}
              </p>
            )}
          </div>
          <Badge variant="green">Finalized</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">
        Consensus Benchmark
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        {completedCount === 0
          ? 'No JA assessments completed yet. Invite assessors below to get started.'
          : `${completedCount} completed assessment${completedCount === 1 ? '' : 's'}. Finalize to compute the consensus benchmark.`
        }
      </p>
      {completedCount > 0 && (
        <>
          {finalizeError && (
            <p className="mb-3 text-sm text-red-600">{finalizeError}</p>
          )}
          <Button size="md" onClick={onFinalize} loading={finalizing} disabled={finalizing}>
            Finalize position
          </Button>
          <p className="mt-2 text-xs text-gray-400">
            This averages the A/R scores from all completed JA assessments. You can still invite
            more assessors after finalizing.
          </p>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PositionDetail() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  const { data, isLoading } = useQuery<PositionDetailResponse>({
    queryKey: ['position', id],
    queryFn: () => api.get<PositionDetailResponse>(`/admin/positions/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const finalizeMutation = useMutation({
    mutationFn: () =>
      api.post(`/admin/positions/${id}/finalize`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['position', id] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      setFinalizeError(null);
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) => {
      setFinalizeError(
        err.response?.data?.error?.message ?? 'Failed to finalize position.'
      );
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => api.delete(`/admin/positions/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      navigate('/admin/positions');
    },
  });

  if (isLoading) {
    return (
      <div className="px-8 py-8">
        <div className="h-8 w-48 rounded bg-gray-100 animate-pulse mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm text-gray-500">Position not found.</p>
        <Link to="/admin/positions" className="mt-2 inline-block text-sm text-accent hover:underline">
          Back to positions
        </Link>
      </div>
    );
  }

  const { position, invitations } = data;
  const completedCount = invitations.filter((i) => i.status === 'completed').length;

  return (
    <div className="px-8 py-8">
      <PageHeader
        title={position.title}
        subtitle={positionStatusLabel(position.status)}
        actions={
          <div className="flex items-center gap-3">
            <Link to="/admin/positions">
              <Button variant="secondary" size="md">Back</Button>
            </Link>
            {!archiveConfirm ? (
              <Button variant="ghost" size="md" onClick={() => setArchiveConfirm(true)}>
                Archive
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Archive this position?</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setArchiveConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  loading={archiveMutation.isPending}
                  onClick={() => archiveMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                >
                  Confirm
                </Button>
              </div>
            )}
          </div>
        }
      />

      {/* Consensus card */}
      <div className="mb-6">
        <ConsensusCard
          position={position}
          completedCount={completedCount}
          onFinalize={() => finalizeMutation.mutate()}
          finalizing={finalizeMutation.isPending}
          finalizeError={finalizeError}
        />
      </div>

      {/* JA Assessors */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-navy">
          JA Assessors
          {invitations.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              {completedCount} of {invitations.length} completed
            </span>
          )}
        </h2>
        <Link to={`/admin/people/invite?positionId=${position.id}&type=ja`}>
          <Button size="sm">
            <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Invite assessor
          </Button>
        </Link>
      </div>

      {invitations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            No assessors yet.{' '}
            <Link
              to={`/admin/people/invite?positionId=${position.id}&type=ja`}
              className="text-accent hover:underline"
            >
              Invite someone
            </Link>{' '}
            to start collecting JA assessments.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">A / R Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invitations.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/admin/people/${inv.respondentId}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-navy">
                      {inv.firstName} {inv.lastName}
                    </div>
                    <div className="text-xs text-gray-400">{inv.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariant(inv.status)}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {inv.aScore800 !== null
                      ? (
                        <>
                          <span className="font-mono">{inv.aScore800}</span>
                          <span className="mx-1 text-gray-300">/</span>
                          <span className="font-mono">{inv.rScore800}</span>
                        </>
                      )
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {formatDate(inv.sentAt)}
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
