import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '../../../components/admin/PageHeader';
import { formatDate } from '../../../lib/utils';
import api from '../../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PerspectiveData {
  perspective:      string;
  aPercentile:      number;
  rPercentile:      number;
  aScore800:        number;
  rScore800:        number;
  primaryProfile:   string;
  secondaryProfile: string | null;
}

interface PFResultDetail {
  id:                       string;
  invitationId:             string;
  email:                    string;
  firstName:                string | null;
  lastName:                 string | null;
  eventId:                  string;
  eventName:                string;
  primaryProfile:           string;
  secondaryProfile:         string | null;
  assertivenessScore:       number;
  responsivenessScore:      number;
  assertivenessPercentile:  number;
  responsivenessPercentile: number;
  selfPerspective:          PerspectiveData;
  workPerspective:          PerspectiveData;
  othersPerspective:        PerspectiveData;
  validityFlags:            string[];
  resultsEmailSent:         boolean;
  resultsEmailSentAt:       string | null;
  completedAt:              string | null;
  createdAt:                string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROFILE_COLORS: Record<string, string> = {
  Driver:       '#1A3A5C',
  Artist:       '#D4AF37',
  Investigator: '#8B9DB8',
  Mediator:     '#4A7C59',
};

const PROFILE_TAGLINES: Record<string, string> = {
  Driver:       'Purposeful. Direct. Action-oriented.',
  Artist:       'Expressive. Energetic. Inspiring.',
  Investigator: 'Thoughtful. Precise. Steady.',
  Mediator:     'Warm. Loyal. Harmonizing.',
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 800) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className="font-mono text-navy">{value} / 800</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-100">
        <div className="h-2.5 rounded-full bg-navy transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PerspectiveCard({ label, p }: { label: string; p: PerspectiveData }) {
  const color = PROFILE_COLORS[p.primaryProfile] ?? '#1A3A5C';
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</h3>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {p.primaryProfile}
          {p.secondaryProfile && ` / ${p.secondaryProfile}`}
        </span>
      </div>
      <div className="space-y-3">
        <ScoreBar label="Assertiveness" value={p.aScore800} />
        <ScoreBar label="Responsiveness" value={p.rScore800} />
      </div>
      <div className="mt-3 text-xs text-gray-400">
        Percentile: A {p.aPercentile.toFixed(0)}th · R {p.rPercentile.toFixed(0)}th
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PFResultDetailPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate     = useNavigate();
  const [toast, setToast] = useState('');

  const { data: result, isLoading } = useQuery<PFResultDetail>({
    queryKey: ['pf-result', resultId],
    queryFn:  () => api.get<PFResultDetail>(`/pf/results/${resultId}`).then((r) => r.data),
    enabled:  !!resultId,
  });

  const resendMutation = useMutation({
    mutationFn: () => api.post(`/pf/results/${resultId}/resend-results`).then((r) => r.data),
    onSuccess: () => {
      setToast(`Results resent to ${result?.email ?? 'attendee'}`);
      setTimeout(() => setToast(''), 3500);
    },
  });

  if (isLoading) return <div className="px-8 py-16 text-center text-sm text-gray-400">Loading…</div>;
  if (!result)   return <div className="px-8 py-8 text-sm text-red-500">Result not found.</div>;

  const profileColor  = PROFILE_COLORS[result.primaryProfile] ?? '#1A3A5C';
  const profileTagline = PROFILE_TAGLINES[result.primaryProfile] ?? '';
  const fullName       = [result.firstName, result.lastName].filter(Boolean).join(' ') || result.email;

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
        <button
          onClick={() => navigate(`/superadmin/people-first/events/${result.eventId}?tab=results`)}
          className="hover:text-navy"
        >
          {result.eventName}
        </button>
        <span>/</span>
        <span className="text-gray-600">{fullName}</span>
      </div>

      <PageHeader
        title={fullName}
        subtitle={`${result.email} · ${result.eventName} · Completed ${formatDate(result.completedAt)}`}
        actions={
          <button
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
            className="rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-navy hover:text-white transition-colors disabled:opacity-50"
          >
            {resendMutation.isPending ? 'Sending…' : 'Resend Results Email'}
          </button>
        }
      />

      {toast && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {toast}
        </div>
      )}

      {/* Validity flags */}
      {Array.isArray(result.validityFlags) && result.validityFlags.length > 0 && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Validity flags: {result.validityFlags.join(', ')}
        </div>
      )}

      {/* Profile hero */}
      <div
        className="rounded-xl p-6 mb-6 text-white"
        style={{ backgroundColor: profileColor }}
      >
        <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-2">
          Primary Profile
        </div>
        <div className="text-4xl font-bold font-serif mb-2">{result.primaryProfile}</div>
        <div className="text-sm opacity-80">{profileTagline}</div>
        {result.secondaryProfile && (
          <div className="mt-3 text-sm opacity-70">
            Secondary: {result.secondaryProfile}
          </div>
        )}
        <div className="mt-4 flex gap-6 text-sm opacity-80">
          <div>
            <div className="text-xs opacity-60 uppercase tracking-wider">Assertiveness</div>
            <div className="font-semibold">{result.assertivenessScore} pts · {result.assertivenessPercentile.toFixed(0)}th %ile</div>
          </div>
          <div>
            <div className="text-xs opacity-60 uppercase tracking-wider">Responsiveness</div>
            <div className="font-semibold">{result.responsivenessScore} pts · {result.responsivenessPercentile.toFixed(0)}th %ile</div>
          </div>
        </div>
      </div>

      {/* Perspective scores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <PerspectiveCard label="Self" p={result.selfPerspective} />
        <PerspectiveCard label="Others" p={result.othersPerspective} />
        <PerspectiveCard label="Work / Tasks" p={result.workPerspective} />
      </div>

      {/* Email status */}
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500">
        {result.resultsEmailSent
          ? `Results email sent ${result.resultsEmailSentAt ? formatDate(result.resultsEmailSentAt) : ''}`
          : 'Results email not yet sent'}
      </div>

      <p className="mt-10 text-center text-xs text-gray-300">
        Powered by the ECS Cornerstone Assessment
      </p>
    </div>
  );
}
