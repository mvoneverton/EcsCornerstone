import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../../components/admin/PageHeader';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { formatDateTime } from '../../../lib/utils';
import api from '../../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PFEvent {
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
  createdAt:       string;
  updatedAt:       string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  couples_night:  'Couples Night',
  family_session: 'Family Session',
  youth_group:    'Youth Group',
  corporate_team: 'Corporate Team',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  couples_night:  'bg-rose-50 text-rose-700',
  family_session: 'bg-amber-50 text-amber-700',
  youth_group:    'bg-green-50 text-green-700',
  corporate_team: 'bg-accent-50 text-accent-700',
};

function statusBadgeVariant(status: string): 'gray' | 'green' | 'amber' | 'red' | 'blue' {
  switch (status) {
    case 'active':    return 'green';
    case 'completed': return 'blue';
    case 'cancelled': return 'red';
    default:          return 'gray';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'draft':     return 'Draft';
    case 'active':    return 'Active';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default:          return status;
  }
}

// ── New Event Modal ───────────────────────────────────────────────────────────

interface NewEventFormData {
  name:      string;
  eventType: string;
  eventDate: string;
  location:  string;
  notes:     string;
  isFree:    boolean;
}

function NewEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<NewEventFormData>({
    name: '', eventType: 'couples_night', eventDate: '', location: '', notes: '', isFree: false,
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: NewEventFormData) =>
      api.post('/pf/events', {
        name:      data.name.trim(),
        eventType: data.eventType,
        eventDate: data.eventDate || null,
        location:  data.location.trim() || null,
        notes:     data.notes.trim() || null,
        isFree:    data.isFree,
      }).then((r) => r.data),
    onSuccess: () => {
      onCreated();
      onClose();
    },
    onError: () => setError('Failed to create event. Please try again.'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Event name is required.'); return; }
    setError('');
    mutation.mutate(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-navy">New People First Event</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Event Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Couples Night — October 2026"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Event Type</label>
            <select
              value={form.eventType}
              onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="couples_night">Couples Night</option>
              <option value="family_session">Family Session</option>
              <option value="youth_group">Youth Group</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Event Date & Time (optional)</label>
            <input
              type="datetime-local"
              value={form.eventDate}
              onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Location (optional)</label>
            <Input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. First Baptist Church, Room 201"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Internal notes about this event..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => setForm((f) => ({ ...f, isFree: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-accent"
            />
            <span className="text-sm text-gray-700">Free event (no payment required)</span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-400 disabled:opacity-50"
            >
              {mutation.isPending ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: PFEvent }) {
  const navigate = useNavigate();
  const typeColor = EVENT_TYPE_COLORS[event.eventType] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-navy font-serif truncate">{event.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor}`}>
              {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
            </span>
            <Badge variant={statusBadgeVariant(event.status)}>{statusLabel(event.status)}</Badge>
            {event.isFree && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-teal-50 text-teal-700">
                Free
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
        <div>
          <span className="text-xs font-medium text-gray-400 block">Date</span>
          {event.eventDate ? formatDateTime(event.eventDate) : 'Date TBD'}
        </div>
        <div>
          <span className="text-xs font-medium text-gray-400 block">Location</span>
          {event.location ?? 'Location TBD'}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>{event.completedCount} of {event.invitationCount} completed</span>
          <span>{event.completionRate}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-navy transition-all"
            style={{ width: `${event.completionRate}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => navigate(`/superadmin/people-first/events/${event.id}`)}
          className="flex-1 rounded-lg border border-navy px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy hover:text-white transition-colors"
        >
          Manage
        </button>
        <button
          onClick={() => navigate(`/superadmin/people-first/events/${event.id}?tab=results`)}
          className="flex-1 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-600 transition-colors"
        >
          View Results
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PFEventsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess]     = useState('');

  const { data, isLoading } = useQuery<{ events: PFEvent[] }>({
    queryKey: ['pf-events'],
    queryFn: () => api.get<{ events: PFEvent[] }>('/pf/events').then((r) => r.data),
  });

  function handleCreated() {
    void queryClient.invalidateQueries({ queryKey: ['pf-events'] });
    setSuccess('Event created. Add attendees to get started.');
    setTimeout(() => setSuccess(''), 4000);
  }

  const events = data?.events ?? [];

  return (
    <div className="px-8 py-8 max-w-6xl">
      <PageHeader
        title="People First Events"
        subtitle={`${events.length} event${events.length !== 1 ? 's' : ''}`}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-400 transition-colors"
          >
            New Event
          </button>
        }
      />

      {success && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {isLoading && (
        <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
      )}

      {!isLoading && events.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-20 text-center">
          <div className="text-base font-medium text-gray-500">No events yet.</div>
          <div className="mt-1 text-sm text-gray-400">Create your first People First event.</div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-400"
          >
            New Event
          </button>
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {showModal && (
        <NewEventModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}

      <p className="mt-12 text-center text-xs text-gray-300">
        Powered by the ECS Cornerstone Assessment
      </p>
    </div>
  );
}
