import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { PageHeader } from '../../../components/admin/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Textarea } from '../../../components/ui/Textarea';
import { ProfileBadge, ProfileScoreBar } from '../../../components/ProfileBadge';
import { PathUnlockPanel } from '../../../components/admin/PathUnlockPanel';
import { formatDate, formatDateTime, fullName, initials } from '../../../lib/utils';
import { invitationStatus, assessmentLabel, assessmentFullName } from '../../../types/admin';
import type { Person, Assessment, AssessmentResult } from '../../../types/admin';
import api from '../../../lib/api';

interface PersonDetailResponse {
  person:      Person;
  assessments: Assessment[];
}

// ── Status badge ──────────────────────────────────────────────────────────────

const statusConfig = {
  completed: { label: 'Completed', variant: 'green' as const },
  opened:    { label: 'Opened',    variant: 'blue'  as const },
  pending:   { label: 'Pending',   variant: 'amber' as const },
  expired:   { label: 'Expired',   variant: 'red'   as const },
};

// ── Result card for one perspective ──────────────────────────────────────────

function ResultCard({ result, invitationId }: { result: AssessmentResult; invitationId: string }) {
  const [downloading, setDownloading] = useState(false);

  async function downloadReport() {
    setDownloading(true);
    try {
      const { data } = await api.get<{ url: string }>(`/admin/reports/${invitationId}`);
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  }

  const perspectiveLabel =
    result.perspective === 'self'   ? 'How You See Yourself' :
    result.perspective === 'others' ? 'How Others See You'   :
    result.perspective === 'work'   ? 'Behavior at Work'     :
    result.perspective;

  return (
    <div className="rounded-lg border border-gray-200 p-5 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{perspectiveLabel}</span>
        {!result.isValid && (
          <Badge variant="amber">Validity concern</Badge>
        )}
      </div>

      <div className="mb-4">
        <ProfileBadge
          label="Primary profile"
          primaryProfile={result.primaryProfile}
          secondaryProfile={result.secondaryProfile}
        />
      </div>

      <div className="space-y-2 mb-4">
        {(['Catalyst', 'Vanguard', 'Cultivator', 'Architect'] as const).map((p) => {
          const scoreKey = `${p.toLowerCase()}Score` as never;
          // derive score from a/r percentiles
          const score =
            p === 'Catalyst'   ? Math.round(((result.aPercentile / 100) * 400) + ((result.rPercentile / 100) * 400)) :
            p === 'Vanguard'   ? Math.round(((result.aPercentile / 100) * 400) + ((1 - result.rPercentile / 100) * 400)) :
            p === 'Cultivator' ? Math.round(((1 - result.aPercentile / 100) * 400) + ((result.rPercentile / 100) * 400)) :
                                 Math.round(((1 - result.aPercentile / 100) * 400) + ((1 - result.rPercentile / 100) * 400));
          void scoreKey;
          return <ProfileScoreBar key={p} profile={p} score={score} />;
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>A score: <strong className="text-gray-700">{result.aScore800}</strong>/800</span>
        <span>R score: <strong className="text-gray-700">{result.rScore800}</strong>/800</span>
        {result.validityFlags?.length > 0 && (
          <span className="text-amber-600">{result.validityFlags.join(', ')}</span>
        )}
      </div>

      {result.reportS3Key && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            size="sm"
            loading={downloading}
            onClick={downloadReport}
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF report
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Assessment section ─────────────────────────────────────────────────────────

function AssessmentSection({ assessment, personId }: { assessment: Assessment; personId: string }) {
  const status      = invitationStatus(assessment);
  const config      = statusConfig[status];
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => api.delete(`/admin/invitations/${assessment.id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['person', personId] }),
  });

  const resendMutation = useMutation({
    mutationFn: () => api.post(`/admin/invitations/${assessment.id}/resend`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['person', personId] }),
  });

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-md bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy">
            {assessmentLabel(assessment.assessmentType)}
          </span>
          <span className="text-sm text-gray-600">{assessmentFullName(assessment.assessmentType)}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>Sent {formatDate(assessment.sentAt)}</span>
          {assessment.completedAt && (
            <span>Completed {formatDate(assessment.completedAt)}</span>
          )}
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </div>

      {/* Results */}
      {assessment.results.length > 0 && (
        <div className={`p-5 bg-gray-50 grid gap-4 ${assessment.results.length > 1 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 max-w-sm'}`}>
          {assessment.results.map((result) => (
            <ResultCard key={result.perspective} result={result} invitationId={assessment.id} />
          ))}
        </div>
      )}

      {status === 'pending' && (
        <div className="flex items-center justify-between px-5 py-4 bg-white">
          <span className="text-sm text-gray-400">Awaiting response. Expires {formatDate(assessment.expiresAt)}.</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              loading={resendMutation.isPending}
              onClick={() => resendMutation.mutate()}
            >
              Resend
            </Button>
            <button
              disabled={cancelMutation.isPending}
              onClick={() => { if (confirm('Cancel this invitation? The link will stop working.')) cancelMutation.mutate(); }}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {cancelMutation.isPending ? 'Cancelling…' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
      {status === 'expired' && (
        <div className="flex items-center justify-between px-5 py-4 bg-white">
          <span className="text-sm text-gray-400">Link expired {formatDate(assessment.expiresAt)} without a response.</span>
          <Button
            size="sm"
            variant="secondary"
            loading={resendMutation.isPending}
            onClick={() => resendMutation.mutate()}
          >
            Resend
          </Button>
        </div>
      )}
      {status === 'opened' && (
        <div className="px-5 py-4 bg-white text-sm text-gray-400">
          Opened {formatDateTime(assessment.openedAt)} — in progress.
        </div>
      )}
    </div>
  );
}

// ── Facilitator notes ─────────────────────────────────────────────────────────

function FacilitatorNotes({ personId, initial }: { personId: string; initial: string | null | undefined }) {
  const queryClient               = useQueryClient();
  const [notes, setNotes]         = useState(initial ?? '');
  const [saved, setSaved]         = useState(false);

  const mutation = useMutation({
    mutationFn: (text: string) =>
      api.patch(`/admin/people/${personId}`, { facilitatorNotes: text }).then((r) => r.data),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      void queryClient.invalidateQueries({ queryKey: ['person', personId] });
    },
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Facilitator notes</h2>
      <Textarea
        rows={4}
        placeholder="Add notes visible only to admins and facilitators…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="mt-3 flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => mutation.mutate(notes)}
          loading={mutation.isPending}
        >
          Save notes
        </Button>
        {saved && (
          <span className="text-xs text-green-600">Saved</span>
        )}
        {mutation.isError && (
          <span className="text-xs text-red-600">Failed to save</span>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery<PersonDetailResponse>({
    queryKey: ['person', id],
    queryFn: () => api.get<PersonDetailResponse>(`/admin/people/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="px-8 py-8">
        <div className="h-8 w-48 rounded bg-gray-100 animate-pulse mb-4" />
        <div className="h-4 w-64 rounded bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm text-red-600">Person not found.</p>
        <Link to="/admin/people" className="mt-2 inline-block text-sm text-accent hover:underline">
          ← Back to People
        </Link>
      </div>
    );
  }

  const { person, assessments } = data;

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-1">
        <Link to="/admin/people" className="text-sm text-accent hover:underline">
          ← People
        </Link>
      </div>

      <PageHeader
        title={fullName(person)}
        subtitle={person.currentPosition ?? person.email}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Person info card */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white text-sm font-semibold">
                {initials(person)}
              </div>
              <div>
                <div className="font-semibold text-navy">{fullName(person)}</div>
                <div className="text-sm text-gray-500">{person.email}</div>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Role</dt>
                <dd>
                  <Badge variant={person.role === 'company_admin' ? 'blue' : person.role === 'facilitator' ? 'teal' : 'gray'}>
                    {person.role === 'company_admin' ? 'Admin' : person.role === 'facilitator' ? 'Facilitator' : 'Respondent'}
                  </Badge>
                </dd>
              </div>
              {person.currentPosition && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Position</dt>
                  <dd className="text-gray-800 text-right max-w-[140px] truncate">{person.currentPosition}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Joined</dt>
                <dd className="text-gray-800">{formatDate(person.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Last login</dt>
                <dd className="text-gray-800">{person.lastLoginAt ? formatDate(person.lastLoginAt) : 'Never'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Assessments</dt>
                <dd className="text-gray-800">{assessments.length} sent</dd>
              </div>
            </dl>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <Link to="/admin/people/invite">
                <Button variant="secondary" size="sm" className="w-full justify-center">
                  Send new assessment
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right column: assessments + notes */}
        <div className="lg:col-span-2 space-y-5">
          {assessments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
              <p className="text-sm text-gray-400">No assessments sent yet.</p>
              <Link to="/admin/people/invite" className="mt-2 inline-block text-sm font-medium text-accent hover:underline">
                Send an invitation →
              </Link>
            </div>
          ) : (
            assessments.map((a) => <AssessmentSection key={a.id} assessment={a} personId={person.id} />)
          )}

          <PathUnlockPanel client={person} />

          <FacilitatorNotes personId={person.id} initial={person.facilitatorNotes} />
        </div>
      </div>
    </div>
  );
}
