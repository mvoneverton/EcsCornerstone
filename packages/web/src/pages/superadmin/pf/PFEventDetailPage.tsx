import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../../components/admin/PageHeader';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { formatDate, formatDateTime } from '../../../lib/utils';
import api from '../../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PFEventDetail {
  id:              string;
  name:            string;
  eventType:       string;
  eventDate:       string | null;
  location:        string | null;
  isFree:          boolean;
  status:          string;
  notes:           string | null;
  invitationCount: number;
  completedCount:  number;
  completionRate:  number;
  updatedAt:       string;
}

interface PFInvitation {
  id:             string;
  email:          string;
  firstName:      string | null;
  lastName:       string | null;
  status:         string;
  invitedAt:      string;
  completedAt:    string | null;
  primaryProfile: string | null;
  resultId:       string | null;
}

interface PFEventDetailResponse {
  event:       PFEventDetail;
  invitations: PFInvitation[];
}

interface PFResult {
  id:                  string;
  invitationId:        string;
  email:               string;
  firstName:           string | null;
  lastName:            string | null;
  primaryProfile:      string;
  secondaryProfile:    string | null;
  assertivenessScore:  number;
  responsivenessScore: number;
  completedAt:         string | null;
  resultsEmailSent:    boolean;
}

interface PFResultsResponse {
  results:         PFResult[];
  profileBreakdown: { profile: string; count: number }[];
  completionRate:  number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  couples_night:  'Couples Night',
  family_session: 'Family Session',
  youth_group:    'Youth Group',
  corporate_team: 'Corporate Team',
};

function invStatusVariant(status: string): 'gray' | 'blue' | 'green' {
  switch (status) {
    case 'in_progress': return 'blue';
    case 'completed':   return 'green';
    default:            return 'gray';
  }
}

function invStatusLabel(status: string): string {
  switch (status) {
    case 'pending':     return 'Pending';
    case 'in_progress': return 'In Progress';
    case 'completed':   return 'Completed';
    default:            return status;
  }
}

const PROFILE_COLORS: Record<string, string> = {
  Driver:       '#1A3A5C',
  Artist:       '#D4AF37',
  Investigator: '#8B9DB8',
  Mediator:     '#4A7C59',
};

// ── Add Attendees Panel ───────────────────────────────────────────────────────

interface AttendeeRow { firstName: string; lastName: string; email: string }

function AddAttendeesPanel({
  eventId,
  onSuccess,
}: { eventId: string; onSuccess: (sent: number) => void }) {
  const [rows, setRows] = useState<AttendeeRow[]>([{ firstName: '', lastName: '', email: '' }]);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (attendees: AttendeeRow[]) =>
      api.post<{ sent: number; skipped: number }>(`/pf/events/${eventId}/invite`, {
        attendees: attendees.map((a) => ({
          email:     a.email.trim(),
          firstName: a.firstName.trim() || undefined,
          lastName:  a.lastName.trim() || undefined,
        })).filter((a) => a.email),
      }).then((r) => r.data),
    onSuccess: (data) => {
      setRows([{ firstName: '', lastName: '', email: '' }]);
      onSuccess(data.sent);
    },
    onError: () => setError('Failed to send invitations. Please try again.'),
  });

  function addRow() {
    setRows((prev) => [...prev, { firstName: '', lastName: '', email: '' }]);
  }

  function updateRow(idx: number, field: keyof AttendeeRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = rows.filter((r) => r.email.trim());
    if (valid.length === 0) { setError('Add at least one email address.'); return; }
    setError('');
    mutation.mutate(rows);
  }

  const validCount = rows.filter((r) => r.email.trim()).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="text-sm font-medium text-gray-700 mb-2">Attendees to invite</div>
      {rows.map((row, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            placeholder="First name"
            value={row.firstName}
            onChange={(e) => updateRow(idx, 'firstName', e.target.value)}
            className="w-32"
          />
          <Input
            placeholder="Last name"
            value={row.lastName}
            onChange={(e) => updateRow(idx, 'lastName', e.target.value)}
            className="w-32"
          />
          <Input
            placeholder="email@example.com"
            type="email"
            value={row.email}
            onChange={(e) => updateRow(idx, 'email', e.target.value)}
            className="flex-1"
          />
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="text-gray-400 hover:text-red-500 flex-shrink-0"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="text-sm text-accent hover:underline font-medium"
      >
        + Add Another
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-gray-400">
          {validCount > 0 ? `Sending invitations to ${validCount} attendee${validCount !== 1 ? 's' : ''}` : ''}
        </span>
        <button
          type="submit"
          disabled={mutation.isPending || validCount === 0}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-50"
        >
          {mutation.isPending ? 'Sending…' : 'Send Invitations'}
        </button>
      </div>
    </form>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({
  event,
  eventId,
  onRefresh,
  onSwitchToAttendees,
}: {
  event: PFEventDetail;
  eventId: string;
  onRefresh: () => void;
  onSwitchToAttendees: () => void;
}) {
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [success, setSuccess]     = useState('');

  const updateMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      api.patch(`/pf/events/${eventId}`, patch).then((r) => r.data),
    onSuccess: () => {
      onRefresh();
      setEditField(null);
      setSuccess('Saved.');
      setTimeout(() => setSuccess(''), 2500);
    },
  });

  function startEdit(field: string, current: string) {
    setEditField(field);
    setEditValue(current);
  }

  function saveEdit(field: string, apiKey: string) {
    updateMutation.mutate({ [apiKey]: editValue || null });
    void field;
  }

  const canAddAttendees = event.status === 'draft' || event.status === 'active';

  return (
    <div className="space-y-6">
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Invited',    value: event.invitationCount },
          { label: 'Completed',  value: event.completedCount },
          { label: 'Pending',    value: event.invitationCount - event.completedCount },
          { label: 'Completion', value: `${event.completionRate}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <div className="text-2xl font-semibold text-navy">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Event details */}
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {[
          { label: 'Event Name',  field: 'name',      apiKey: 'name',      value: event.name },
          { label: 'Event Type',  field: 'eventType', apiKey: 'eventType', value: EVENT_TYPE_LABELS[event.eventType] ?? event.eventType },
          { label: 'Date & Time', field: 'eventDate', apiKey: 'eventDate', value: event.eventDate ? formatDateTime(event.eventDate) : 'TBD' },
          { label: 'Location',    field: 'location',  apiKey: 'location',  value: event.location ?? 'TBD' },
          { label: 'Notes',       field: 'notes',     apiKey: 'notes',     value: event.notes ?? '—' },
        ].map(({ label, field, apiKey, value }) => (
          <div key={field} className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="text-xs font-medium text-gray-400">{label}</div>
              {editField === field ? (
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => saveEdit(field, apiKey)}
                    disabled={updateMutation.isPending}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditField(null)}
                    className="text-xs font-medium text-gray-400 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="text-sm text-navy">{value}</div>
              )}
            </div>
            {editField !== field && (
              <button
                onClick={() => startEdit(field, value === 'TBD' || value === '—' ? '' : value)}
                className="text-xs font-medium text-accent hover:underline"
              >
                Edit
              </button>
            )}
          </div>
        ))}

        {/* Status selector */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <div className="text-xs font-medium text-gray-400">Status</div>
            <div className="mt-1">
              <select
                value={event.status}
                onChange={(e) => updateMutation.mutate({ status: e.target.value })}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 focus:border-accent focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {canAddAttendees && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Add Attendees</h3>
          </div>
          <AddAttendeesPanel
            eventId={eventId}
            onSuccess={(sent) => {
              onRefresh();
              onSwitchToAttendees();
              setSuccess(`${sent} invitation${sent !== 1 ? 's' : ''} sent.`);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Attendees Tab ─────────────────────────────────────────────────────────────

function AttendeesTab({
  invitations,
  eventId,
  onRefresh,
  event,
}: {
  invitations: PFInvitation[];
  eventId: string;
  onRefresh: () => void;
  event: PFEventDetail;
}) {
  const [toast, setToast] = useState('');

  const resendInvMutation = useMutation({
    mutationFn: (invId: string) =>
      api.post(`/pf/invitations/${invId}/resend`).then((r) => r.data),
    onSuccess: (_data, invId) => {
      const inv = invitations.find((i) => i.id === invId);
      setToast(`Invitation resent to ${inv?.email ?? 'attendee'}`);
      setTimeout(() => setToast(''), 3500);
    },
  });

  const resendResultsMutation = useMutation({
    mutationFn: (rid: string) =>
      api.post(`/pf/results/${rid}/resend-results`).then((r) => r.data),
    onSuccess: () => {
      setToast('Results resent.');
      setTimeout(() => setToast(''), 3500);
    },
  });

  const canAddMore = event.status === 'draft' || event.status === 'active';
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-4">
      {toast && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{invitations.length} attendee{invitations.length !== 1 ? 's' : ''}</div>
        {canAddMore && (
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-navy hover:bg-gold-400"
          >
            {showAdd ? 'Close' : 'Add Attendees'}
          </button>
        )}
      </div>

      {showAdd && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <AddAttendeesPanel
            eventId={eventId}
            onSuccess={(sent) => {
              onRefresh();
              setShowAdd(false);
              setToast(`${sent} invitation${sent !== 1 ? 's' : ''} sent.`);
            }}
          />
        </div>
      )}

      {invitations.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
          No attendees yet. Add attendees to send invitations.
        </div>
      )}

      {invitations.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invited</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-navy">
                    {inv.firstName || inv.lastName
                      ? `${inv.firstName ?? ''} ${inv.lastName ?? ''}`.trim()
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{inv.email}</td>
                  <td className="px-5 py-3">
                    <Badge variant={invStatusVariant(inv.status)}>{invStatusLabel(inv.status)}</Badge>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400">{formatDate(inv.invitedAt)}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{inv.completedAt ? formatDate(inv.completedAt) : '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(inv.status === 'pending' || inv.status === 'in_progress') && (
                        <button
                          onClick={() => resendInvMutation.mutate(inv.id)}
                          disabled={resendInvMutation.isPending}
                          className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
                        >
                          Resend Invite
                        </button>
                      )}
                      {inv.status === 'completed' && inv.resultId && (
                        <>
                          <Link
                            to={`/superadmin/people-first/results/${inv.resultId}`}
                            className="text-xs font-medium text-accent hover:underline"
                          >
                            View Results
                          </Link>
                          <button
                            onClick={() => resendResultsMutation.mutate(inv.resultId!)}
                            disabled={resendResultsMutation.isPending}
                            className="text-xs font-medium text-gray-400 hover:text-accent hover:underline disabled:opacity-50"
                          >
                            Resend Results
                          </button>
                        </>
                      )}
                    </div>
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

// ── Results Tab ───────────────────────────────────────────────────────────────

function ResultsTab({ eventId }: { eventId: string }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');

  const { data, isLoading } = useQuery<PFResultsResponse>({
    queryKey: ['pf-event-results', eventId],
    queryFn:  () => api.get<PFResultsResponse>(`/pf/events/${eventId}/results`).then((r) => r.data),
  });

  const resendMutation = useMutation({
    mutationFn: (resultId: string) =>
      api.post(`/pf/results/${resultId}/resend-results`).then((r) => r.data),
    onSuccess: (_data, resultId) => {
      const result = data?.results.find((r) => r.id === resultId);
      setToast(`Results resent to ${result?.email ?? 'attendee'}`);
      setTimeout(() => setToast(''), 3500);
    },
  });

  if (isLoading) return <div className="py-10 text-center text-sm text-gray-400">Loading…</div>;
  if (!data) return null;

  const { results, profileBreakdown, completionRate } = data;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
          {toast}
        </div>
      )}

      {results.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
          No results yet — waiting for attendees to complete their assessments.
        </div>
      )}

      {results.length > 0 && (
        <>
          {/* Profile breakdown */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {['Driver', 'Artist', 'Investigator', 'Mediator'].map((profile) => {
              const entry    = profileBreakdown.find((p) => p.profile === profile);
              const count    = entry?.count ?? 0;
              const pct      = results.length > 0 ? Math.round((count / results.length) * 100) : 0;
              const color    = PROFILE_COLORS[profile] ?? '#1A3A5C';
              return (
                <div key={profile} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div
                    className="w-8 h-8 rounded-full mb-3 flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {profile[0]}
                  </div>
                  <div className="text-lg font-semibold text-navy">{count}</div>
                  <div className="text-xs text-gray-400">{profile}</div>
                  <div className="mt-2 h-1 w-full rounded-full bg-gray-100">
                    <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <div className="mt-1 text-xs text-gray-400">{pct}%</div>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-gray-400">
            {results.length} of {Math.round(results.length / (completionRate / 100))} completed ({completionRate}%)
          </div>

          {/* Results table */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Secondary</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scores A/R</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-navy">
                      {r.firstName || r.lastName
                        ? `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim()
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{r.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: PROFILE_COLORS[r.primaryProfile] ?? '#1A3A5C' }}
                      >
                        {r.primaryProfile}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{r.secondaryProfile ?? '—'}</td>
                    <td className="px-5 py-3 text-sm font-mono text-gray-600">
                      {r.assertivenessScore} / {r.responsivenessScore}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">{formatDate(r.completedAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/superadmin/people-first/results/${r.id}`)}
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          View Detail
                        </button>
                        <button
                          onClick={() => resendMutation.mutate(r.id)}
                          disabled={resendMutation.isPending}
                          className="text-xs font-medium text-gray-400 hover:text-accent hover:underline disabled:opacity-50"
                        >
                          Resend Results
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PFEventDetailPage() {
  const { eventId }      = useParams<{ eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient      = useQueryClient();
  const navigate         = useNavigate();

  const initialTab = (searchParams.get('tab') ?? 'overview') as 'overview' | 'attendees' | 'results';
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'results'>(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'attendees' || tab === 'results') setActiveTab(tab);
    else setActiveTab('overview');
  }, [searchParams]);

  function switchTab(tab: 'overview' | 'attendees' | 'results') {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  }

  const { data, isLoading } = useQuery<PFEventDetailResponse>({
    queryKey: ['pf-event', eventId],
    queryFn:  () => api.get<PFEventDetailResponse>(`/pf/events/${eventId}`).then((r) => r.data),
    enabled:  !!eventId,
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['pf-event', eventId] });
    void queryClient.invalidateQueries({ queryKey: ['pf-events'] });
  }

  if (isLoading) return <div className="px-8 py-16 text-center text-sm text-gray-400">Loading…</div>;
  if (!data)     return <div className="px-8 py-8 text-sm text-red-500">Event not found.</div>;

  const { event, invitations } = data;
  const hasResults = invitations.some((i) => i.status === 'completed');

  const TABS: { key: 'overview' | 'attendees' | 'results'; label: string }[] = [
    { key: 'overview',   label: 'Overview' },
    { key: 'attendees',  label: `Attendees (${invitations.length})` },
    { key: 'results',    label: 'Results' },
  ];

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
        <button onClick={() => navigate('/superadmin/people-first/events')} className="hover:text-navy">
          People First Events
        </button>
        <span>/</span>
        <span className="text-gray-600">{event.name}</span>
      </div>

      <PageHeader title={event.name} subtitle={`People First · ${event.eventType.replace(/_/g, ' ')}`} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(({ key, label }) => (
          (!hasResults && key === 'results') ? null : (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-navy text-navy'
                  : 'border-transparent text-gray-500 hover:text-navy hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          )
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab
          event={event}
          eventId={eventId!}
          onRefresh={refresh}
          onSwitchToAttendees={() => switchTab('attendees')}
        />
      )}

      {activeTab === 'attendees' && (
        <AttendeesTab
          invitations={invitations}
          eventId={eventId!}
          onRefresh={refresh}
          event={event}
        />
      )}

      {activeTab === 'results' && hasResults && (
        <ResultsTab eventId={eventId!} />
      )}

      <p className="mt-12 text-center text-xs text-gray-300">
        Powered by the ECS Cornerstone Assessment
      </p>
    </div>
  );
}
