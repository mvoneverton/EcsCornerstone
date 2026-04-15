import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProfileBadge } from '../../components/ProfileBadge';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../lib/utils';
import { assessmentLabel } from '../../types/admin';
import api from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ResultRow {
  invitationId:     string;
  assessmentType:   string;
  completedAt:      string;
  respondent: {
    id:        string;
    firstName: string;
    lastName:  string;
    email:     string;
  };
  perspective:      string;
  aPercentile:      number;
  rPercentile:      number;
  aScore800:        number;
  rScore800:        number;
  primaryProfile:   string;
  secondaryProfile: string | null;
  reportS3Key:      string | null;
}

interface ResultsResponse {
  results:      ResultRow[];
  distribution: Record<string, number>;
  pagination: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
  };
}

// ── Profile distribution card ─────────────────────────────────────────────────

const PROFILE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Catalyst:   { bg: 'bg-catalyst-bg',   text: 'text-catalyst-text',   bar: 'bg-catalyst-mid'   },
  Vanguard:   { bg: 'bg-vanguard-bg',   text: 'text-vanguard-text',   bar: 'bg-vanguard-mid'   },
  Cultivator: { bg: 'bg-cultivator-bg', text: 'text-cultivator-text', bar: 'bg-cultivator-mid' },
  Architect:  { bg: 'bg-architect-bg',  text: 'text-architect-text',  bar: 'bg-architect-mid'  },
};

function DistributionCard({
  distribution,
  total,
  onFilter,
  activeProfile,
}: {
  distribution: Record<string, number>;
  total: number;
  onFilter: (profile: string | null) => void;
  activeProfile: string | null;
}) {
  const profiles = ['Catalyst', 'Vanguard', 'Cultivator', 'Architect'];

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
        Profile Distribution
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {profiles.map((profile) => {
          const count   = distribution[profile] ?? 0;
          const pct     = total > 0 ? Math.round((count / total) * 100) : 0;
          const colors  = PROFILE_COLORS[profile]!;
          const isActive = activeProfile === profile;

          return (
            <button
              key={profile}
              onClick={() => onFilter(isActive ? null : profile)}
              className={`rounded-lg p-4 text-left transition-all ${colors.bg} ${
                isActive ? 'ring-2 ring-accent ring-offset-1' : 'hover:opacity-90'
              }`}
            >
              <div className={`text-2xl font-bold ${colors.text}`}>{count}</div>
              <div className={`mt-0.5 text-sm font-medium ${colors.text}`}>{profile}</div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-black/10">
                <div
                  className={`h-1.5 rounded-full transition-all ${colors.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className={`mt-1 text-xs ${colors.text} opacity-75`}>{pct}%</div>
            </button>
          );
        })}
      </div>
      {activeProfile && (
        <button
          onClick={() => onFilter(null)}
          className="mt-3 text-xs text-accent hover:underline"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}

// ── Perspective label helper ──────────────────────────────────────────────────

function perspectiveLabel(p: string): string {
  if (p === 'self')   return 'Self';
  if (p === 'others') return 'Others';
  if (p === 'work')   return 'Work';
  if (p === 'single') return 'Single';
  return p;
}

// ── PDF download button ───────────────────────────────────────────────────────

function DownloadButton({ invitationId }: { invitationId: string }) {
  const [loading, setLoading] = useState(false);

  async function download(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading(true);
    try {
      const { data } = await api.get<{ url: string }>(`/admin/reports/${invitationId}`);
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={download}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline disabled:opacity-50"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {loading ? 'Opening…' : 'PDF'}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Results() {
  const navigate = useNavigate();

  const [page, setPage]                         = useState(1);
  const [profileFilter, setProfileFilter]       = useState<string | null>(null);
  const [typeFilter, setTypeFilter]             = useState('');
  const [perspFilter, setPerspFilter]           = useState('self');
  const [dateFrom, setDateFrom]                 = useState('');
  const [dateTo, setDateTo]                     = useState('');
  const [personSearch, setPersonSearch]         = useState('');
  const [debouncedPerson, setDebouncedPerson]   = useState('');
  const [debounceTimer, setDebounceTimer]       = useState<ReturnType<typeof setTimeout> | null>(null);

  function handlePersonSearch(val: string) {
    setPersonSearch(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => { setDebouncedPerson(val); setPage(1); }, 400);
    setDebounceTimer(t);
  }

  function resetFilters() {
    setProfileFilter(null);
    setTypeFilter('');
    setPerspFilter('self');
    setDateFrom('');
    setDateTo('');
    setPersonSearch('');
    setDebouncedPerson('');
    setPage(1);
  }

  function handleFilterChange(setter: (v: string) => void) {
    return (v: string) => { setter(v); setPage(1); };
  }

  function handleProfileFilter(profile: string | null) {
    setProfileFilter(profile);
    setPage(1);
  }

  const params = new URLSearchParams({ page: String(page), limit: '25' });
  if (profileFilter)   params.set('profile', profileFilter);
  if (typeFilter)      params.set('type', typeFilter);
  if (perspFilter)     params.set('perspective', perspFilter);
  if (dateFrom)        params.set('dateFrom', dateFrom);
  if (dateTo)          params.set('dateTo', dateTo);
  if (debouncedPerson) params.set('respondentSearch', debouncedPerson);

  const { data, isLoading } = useQuery<ResultsResponse>({
    queryKey: ['results', page, profileFilter, typeFilter, perspFilter, dateFrom, dateTo, debouncedPerson],
    queryFn: () => api.get<ResultsResponse>(`/admin/results?${params}`).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const results    = data?.results    ?? [];
  const dist       = data?.distribution ?? {};
  const pagination = data?.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 1 };
  const totalCount = Object.values(dist).reduce((a, b) => a + b, 0);
  const hasFilter  = !!(profileFilter || typeFilter || (perspFilter && perspFilter !== 'self') || dateFrom || dateTo || debouncedPerson);

  return (
    <div className="px-8 py-8">
      <PageHeader
        title="Results"
        subtitle={pagination.total > 0 ? `${pagination.total} result${pagination.total === 1 ? '' : 's'}` : undefined}
      />

      {/* Distribution */}
      <DistributionCard
        distribution={dist}
        total={totalCount}
        onFilter={handleProfileFilter}
        activeProfile={profileFilter}
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">Person</label>
          <Input
            type="search"
            placeholder="Search by name or email…"
            value={personSearch}
            onChange={(e) => handlePersonSearch(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Perspective</label>
          <select
            value={perspFilter}
            onChange={(e) => handleFilterChange(setPerspFilter)(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All perspectives</option>
            <option value="self">Self</option>
            <option value="others">Others</option>
            <option value="work">Work</option>
            <option value="single">Single</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => handleFilterChange(setTypeFilter)(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All types</option>
            <option value="pca">PCA</option>
            <option value="wsa">WSA</option>
            <option value="ja">JA</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Completed from</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleFilterChange(setDateFrom)(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleFilterChange(setDateTo)(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {hasFilter && (
          <button onClick={resetFilters} className="pb-1.5 text-sm text-accent hover:underline">
            Reset filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Person</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Perspective</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">A / R Score</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div
                        className="h-4 rounded bg-gray-100 animate-pulse"
                        style={{ width: j === 0 ? '140px' : j === 3 ? '100px' : '80px' }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}
            {!isLoading && results.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                  No completed results match your filters.
                </td>
              </tr>
            )}
            {!isLoading && results.map((r, idx) => (
              <tr
                key={`${r.invitationId}-${r.perspective}-${idx}`}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/admin/people/${r.respondent.id}`)}
              >
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-navy">
                    {r.respondent.firstName} {r.respondent.lastName}
                  </div>
                  <div className="text-xs text-gray-400">{r.respondent.email}</div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="blue">{assessmentLabel(r.assessmentType)}</Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {perspectiveLabel(r.perspective)}
                </td>
                <td className="px-6 py-4">
                  <ProfileBadge
                    primaryProfile={r.primaryProfile}
                    secondaryProfile={r.secondaryProfile ?? undefined}
                    compact
                  />
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="font-mono">{r.aScore800}</span>
                  <span className="mx-1 text-gray-300">/</span>
                  <span className="font-mono">{r.rScore800}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {formatDate(r.completedAt)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {r.reportS3Key && (
                      <DownloadButton invitationId={r.invitationId} />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/people/${r.respondent.id}`);
                      }}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
