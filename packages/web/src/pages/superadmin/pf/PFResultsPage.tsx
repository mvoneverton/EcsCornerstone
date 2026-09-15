import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../../components/admin/PageHeader';
import { formatDate } from '../../../lib/utils';
import api from '../../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PFResultRow {
  id:               string;
  invitationId:     string;
  email:            string;
  firstName:        string | null;
  lastName:         string | null;
  eventId:          string;
  eventName:        string;
  primaryProfile:   string;
  secondaryProfile: string | null;
  completedAt:      string | null;
}

interface PFResultsResponse {
  results:         PFResultRow[];
  profileBreakdown: { profile: string; count: number }[];
  pagination: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
  };
}

interface PFEvent {
  id:        string;
  name:      string;
  eventType: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROFILE_COLORS: Record<string, string> = {
  Driver:       '#1A3A5C',
  Artist:       '#D4AF37',
  Investigator: '#8B9DB8',
  Mediator:     '#4A7C59',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  couples_night:  'Couples Night',
  family_session: 'Family Session',
  youth_group:    'Youth Group',
  corporate_team: 'Corporate Team',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PFResultsPage() {
  const navigate = useNavigate();

  const [page, setPage]               = useState(1);
  const [eventFilter, setEventFilter] = useState('');
  const [profileFilter, setProfileFilter] = useState('');
  const [typeFilter, setTypeFilter]   = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '25' });
  if (eventFilter)   params.set('eventId', eventFilter);
  if (profileFilter) params.set('profile', profileFilter.toLowerCase());
  if (typeFilter)    params.set('eventType', typeFilter);

  const { data, isLoading } = useQuery<PFResultsResponse>({
    queryKey: ['pf-all-results', page, eventFilter, profileFilter, typeFilter],
    queryFn:  () => api.get<PFResultsResponse>(`/pf/results?${params.toString()}`).then((r) => r.data),
  });

  const { data: eventsData } = useQuery<{ events: PFEvent[] }>({
    queryKey: ['pf-events-list'],
    queryFn:  () => api.get<{ events: PFEvent[] }>('/pf/events').then((r) => r.data),
  });

  const results         = data?.results ?? [];
  const profileBreakdown = data?.profileBreakdown ?? [];
  const pagination      = data?.pagination;
  const events          = eventsData?.events ?? [];

  return (
    <div className="px-8 py-8 max-w-6xl">
      <PageHeader
        title="People First Results"
        subtitle="All assessment results across events"
      />

      {/* Profile summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {['Driver', 'Artist', 'Investigator', 'Mediator'].map((profile) => {
          const entry = profileBreakdown.find((p) => p.profile === profile);
          const count = entry?.count ?? 0;
          const total = profileBreakdown.reduce((s, p) => s + p.count, 0);
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
          const color = PROFILE_COLORS[profile] ?? '#1A3A5C';
          return (
            <div key={profile} className="rounded-xl border border-gray-200 bg-white p-4">
              <div
                className="w-7 h-7 rounded-full mb-2 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: color }}
              >
                {profile[0]}
              </div>
              <div className="text-xl font-semibold text-navy">{count}</div>
              <div className="text-xs text-gray-400">{profile} · {pct}%</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Event</label>
          <select
            value={eventFilter}
            onChange={(e) => { setEventFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-accent focus:outline-none"
          >
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Profile</label>
          <select
            value={profileFilter}
            onChange={(e) => { setProfileFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-accent focus:outline-none"
          >
            <option value="">All profiles</option>
            <option value="driver">Driver</option>
            <option value="artist">Artist</option>
            <option value="investigator">Investigator</option>
            <option value="mediator">Mediator</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Event Type</label>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-accent focus:outline-none"
          >
            <option value="">All types</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {(eventFilter || profileFilter || typeFilter) && (
          <button
            onClick={() => { setEventFilter(''); setProfileFilter(''); setTypeFilter(''); setPage(1); }}
            className="text-xs font-medium text-gray-400 hover:text-navy"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Loading…</td></tr>
            )}
            {!isLoading && results.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">No results match your filters.</td></tr>
            )}
            {!isLoading && results.map((r) => (
              <tr
                key={r.id}
                onClick={() => navigate(`/superadmin/people-first/results/${r.id}`)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-5 py-3 text-sm font-medium text-navy">
                  {r.firstName || r.lastName
                    ? `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim()
                    : '—'}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{r.email}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{r.eventName}</td>
                <td className="px-5 py-3">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: PROFILE_COLORS[r.primaryProfile] ?? '#1A3A5C' }}
                  >
                    {r.primaryProfile}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-400">{formatDate(r.completedAt)}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/superadmin/people-first/results/${r.id}`); }}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    View Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            {pagination.total} results · page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-gray-300">
        Powered by the ECS Cornerstone Assessment
      </p>
    </div>
  );
}
