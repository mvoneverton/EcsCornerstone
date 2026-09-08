import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../../components/admin/PageHeader';
import { Button } from '../../../components/ui/Button';
import { ProfileBadge } from '../../../components/ProfileBadge';
import { formatDate } from '../../../lib/utils';
import { assessmentLabel } from '../../../types/admin';
import api from '../../../lib/api';

interface Perspective {
  perspective:      string;
  aPercentile:      number;
  rPercentile:      number;
  aScore800:        number;
  rScore800:        number;
  primaryProfile:   string;
  secondaryProfile: string | null;
  isValid:          boolean;
  validityFlags:    string[];
}

interface ResultDetailResponse {
  respondent: { firstName: string; lastName: string; email: string };
  position:   { id: string; title: string } | null;
  assessmentType:   string;
  completedAt:      string;
  primaryProfile:   string;
  secondaryProfile: string | null;
  perspectives:     Perspective[];
  hasReport:        boolean;
  reportUrlEndpoint: string;
}

function perspectiveLabel(p: string): string {
  if (p === 'self')   return 'Self';
  if (p === 'others') return 'Others';
  if (p === 'work')   return 'Work';
  if (p === 'single') return 'Single';
  return p;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 800) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className="font-mono text-navy">{value} / 800</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-100">
        <div
          className="h-2.5 rounded-full bg-navy transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PerspectiveCard({ p }: { p: Perspective }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          {perspectiveLabel(p.perspective)}
        </h3>
        <ProfileBadge primaryProfile={p.primaryProfile} secondaryProfile={p.secondaryProfile ?? undefined} compact />
      </div>
      <div className="space-y-4">
        <ScoreBar label="Assertiveness" value={p.aScore800} />
        <ScoreBar label="Responsiveness" value={p.rScore800} />
      </div>
      {!p.isValid && p.validityFlags.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Validity flags: {p.validityFlags.join(', ')}
        </div>
      )}
    </div>
  );
}

export default function ResultDetail() {
  const { resultId } = useParams<{ resultId: string }>();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<ResultDetailResponse>({
    queryKey: ['result-detail', resultId],
    queryFn: () => api.get<ResultDetailResponse>(`/admin/results/${resultId}`).then((r) => r.data),
    enabled: !!resultId,
  });

  async function downloadReport() {
    if (!resultId) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const { data: url } = await api.get<{ url?: string; status?: string }>(`/reports/${resultId}/url`);
      if (url.status === 'generating') {
        setDownloadError('Report is still being generated — try again shortly.');
        return;
      }
      if (url.url) window.open(url.url, '_blank', 'noopener,noreferrer');
    } catch {
      setDownloadError('Could not fetch the report link.');
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="px-8 py-8">
        <div className="h-8 w-48 rounded bg-gray-100 animate-pulse mb-6" />
        <div className="h-40 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm text-gray-500">Result not found.</p>
        <Link to="/admin/results" className="mt-2 inline-block text-sm text-accent hover:underline">
          Back to results
        </Link>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <PageHeader
        title={`${data.respondent.firstName} ${data.respondent.lastName}`}
        subtitle={`${assessmentLabel(data.assessmentType)} · Completed ${formatDate(data.completedAt)}`}
        actions={
          <div className="flex items-center gap-3">
            <Link to="/admin/results">
              <Button variant="secondary" size="md">Back</Button>
            </Link>
            <Button size="md" onClick={downloadReport} loading={downloading} disabled={!data.hasReport && !downloading}>
              {data.hasReport ? 'Download Full Report' : 'Generating…'}
            </Button>
          </div>
        }
      />

      {downloadError && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {downloadError}
        </div>
      )}

      {/* Respondent + position header */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400">{data.respondent.email}</div>
            {data.position && (
              <div className="mt-1 text-sm text-gray-600">Position: {data.position.title}</div>
            )}
          </div>
          <ProfileBadge
            primaryProfile={data.primaryProfile}
            secondaryProfile={data.secondaryProfile ?? undefined}
          />
        </div>
      </div>

      {/* Perspective breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.perspectives.map((p) => (
          <PerspectiveCard key={p.perspective} p={p} />
        ))}
      </div>
    </div>
  );
}
