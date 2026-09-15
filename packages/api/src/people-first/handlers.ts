import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import pool from '../db/client';
import { mapToPFProfile, pfProfileDisplayName } from './profileMapping';
import type { PFProfile } from './profileMapping';
import { sendPFInvitationEmail, sendPFResultsEmail } from '../lib/email';

// ── Helpers ───────────────────────────────────────────────────────────────────

function safePFProfile(raw: string): PFProfile {
  try {
    return mapToPFProfile(raw);
  } catch {
    return raw as PFProfile;
  }
}

function displayName(raw: string): string {
  const mapped = safePFProfile(raw);
  return pfProfileDisplayName[mapped] ?? raw;
}

// ── POST /api/pf/events ───────────────────────────────────────────────────────

export async function createEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, eventType, eventDate, location, isFree, notes } = req.body as {
      name: string;
      eventType: string;
      eventDate?: string | null;
      location?: string | null;
      isFree?: boolean;
      notes?: string | null;
    };

    if (!name?.trim()) {
      res.status(400).json({ error: { message: 'name is required', code: 'VALIDATION_ERROR' } });
      return;
    }

    const validTypes = ['couples_night', 'family_session', 'youth_group', 'corporate_team'];
    if (!validTypes.includes(eventType)) {
      res.status(400).json({ error: { message: 'Invalid eventType', code: 'VALIDATION_ERROR' } });
      return;
    }

    const { rows: [event] } = await pool.query<{
      id: string; name: string; event_type: string; facilitator_id: string;
      event_date: Date | null; location: string | null; is_free: boolean;
      notes: string | null; status: string; created_at: Date; updated_at: Date;
    }>(
      `INSERT INTO pf_events (name, event_type, facilitator_id, event_date, location, is_free, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name.trim(), eventType, req.user!.sub, eventDate ?? null, location ?? null, isFree ?? false, notes ?? null]
    );

    res.status(201).json({ event: toEventDto(event, 0, 0) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/pf/events ────────────────────────────────────────────────────────

export async function listEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rows } = await pool.query<{
      id: string; name: string; event_type: string; facilitator_id: string;
      event_date: Date | null; location: string | null; is_free: boolean;
      notes: string | null; status: string; created_at: Date; updated_at: Date;
      invitation_count: string; completed_count: string;
    }>(
      `SELECT
         e.id, e.name, e.event_type, e.facilitator_id,
         e.event_date, e.location, e.is_free, e.notes, e.status,
         e.created_at, e.updated_at,
         COUNT(i.id)                                                    AS invitation_count,
         COUNT(i.id) FILTER (WHERE i.status = 'completed')             AS completed_count
       FROM pf_events e
       LEFT JOIN pf_invitations i ON i.event_id = e.id
       WHERE e.facilitator_id = $1
       GROUP BY e.id
       ORDER BY e.event_date DESC NULLS LAST, e.created_at DESC`,
      [req.user!.sub]
    );

    res.json({
      events: rows.map((r) => {
        const inv  = parseInt(r.invitation_count, 10);
        const comp = parseInt(r.completed_count, 10);
        return toEventDto(r, inv, comp);
      }),
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/pf/events/:eventId ───────────────────────────────────────────────

export async function getEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { eventId } = req.params;

    const { rows: [event] } = await pool.query<{
      id: string; name: string; event_type: string; facilitator_id: string;
      event_date: Date | null; location: string | null; is_free: boolean;
      notes: string | null; status: string; created_at: Date; updated_at: Date;
    }>(
      `SELECT * FROM pf_events WHERE id = $1 AND facilitator_id = $2`,
      [eventId, req.user!.sub]
    );

    if (!event) {
      res.status(404).json({ error: { message: 'Event not found', code: 'NOT_FOUND' } });
      return;
    }

    const { rows: invitations } = await pool.query<{
      id: string; email: string; first_name: string | null; last_name: string | null;
      status: string; invited_at: Date; completed_at: Date | null;
      primary_profile: string | null; result_id: string | null;
    }>(
      `SELECT
         i.id, i.email, i.first_name, i.last_name, i.status,
         i.invited_at, i.completed_at,
         r.primary_profile, r.id AS result_id
       FROM pf_invitations i
       LEFT JOIN pf_results r ON r.id = i.result_id
       WHERE i.event_id = $1
       ORDER BY i.invited_at`,
      [eventId]
    );

    res.json({
      event: toEventDto(event, invitations.length, invitations.filter((i) => i.status === 'completed').length),
      invitations: invitations.map((i) => ({
        id:             i.id,
        email:          i.email,
        firstName:      i.first_name,
        lastName:       i.last_name,
        status:         i.status,
        invitedAt:      i.invited_at,
        completedAt:    i.completed_at,
        primaryProfile: i.primary_profile ? displayName(i.primary_profile) : null,
        resultId:       i.result_id ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/pf/events/:eventId ─────────────────────────────────────────────

export async function updateEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { eventId } = req.params;

    const { rows: [existing] } = await pool.query<{ id: string }>(
      `SELECT id FROM pf_events WHERE id = $1 AND facilitator_id = $2`,
      [eventId, req.user!.sub]
    );
    if (!existing) {
      res.status(404).json({ error: { message: 'Event not found', code: 'NOT_FOUND' } });
      return;
    }

    const fields = req.body as Partial<{
      name: string; eventType: string; eventDate: string | null;
      location: string | null; isFree: boolean; notes: string | null; status: string;
    }>;

    const setClauses: string[] = ['updated_at = NOW()'];
    const values: unknown[]    = [];

    function push(expr: string, val: unknown) {
      values.push(val);
      setClauses.push(`${expr} = $${values.length}`);
    }

    if (fields.name       !== undefined) push('name',        fields.name?.trim() ?? null);
    if (fields.eventType  !== undefined) push('event_type',  fields.eventType);
    if (fields.eventDate  !== undefined) push('event_date',  fields.eventDate ?? null);
    if (fields.location   !== undefined) push('location',    fields.location  ?? null);
    if (fields.isFree     !== undefined) push('is_free',     fields.isFree);
    if (fields.notes      !== undefined) push('notes',       fields.notes     ?? null);
    if (fields.status     !== undefined) push('status',      fields.status);

    values.push(eventId);
    const { rows: [updated] } = await pool.query<{
      id: string; name: string; event_type: string; facilitator_id: string;
      event_date: Date | null; location: string | null; is_free: boolean;
      notes: string | null; status: string; created_at: Date; updated_at: Date;
    }>(
      `UPDATE pf_events SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    res.json({ event: toEventDto(updated, 0, 0) });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/pf/events/:eventId ────────────────────────────────────────────

export async function deleteEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { eventId } = req.params;

    const { rows: [event] } = await pool.query<{
      id: string; status: string; invitation_count: string;
    }>(
      `SELECT e.id, e.status, COUNT(i.id) AS invitation_count
       FROM pf_events e
       LEFT JOIN pf_invitations i ON i.event_id = e.id
       WHERE e.id = $1 AND e.facilitator_id = $2
       GROUP BY e.id`,
      [eventId, req.user!.sub]
    );

    if (!event) {
      res.status(404).json({ error: { message: 'Event not found', code: 'NOT_FOUND' } });
      return;
    }

    if (event.status !== 'draft' || parseInt(event.invitation_count, 10) > 0) {
      res.status(409).json({
        error: {
          message: 'Cannot delete an event that has invitations. Cancel the event instead.',
          code: 'CANNOT_DELETE',
        },
      });
      return;
    }

    await pool.query(`DELETE FROM pf_events WHERE id = $1`, [eventId]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/pf/events/:eventId/invite ──────────────────────────────────────

export async function inviteAttendees(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { eventId } = req.params;
    const { attendees } = req.body as {
      attendees: { email: string; firstName?: string; lastName?: string }[];
    };

    if (!Array.isArray(attendees) || attendees.length === 0) {
      res.status(400).json({ error: { message: 'attendees array required', code: 'VALIDATION_ERROR' } });
      return;
    }

    const { rows: [event] } = await pool.query<{
      id: string; name: string; event_date: Date | null; is_free: boolean; status: string;
    }>(
      `SELECT id, name, event_date, is_free, status FROM pf_events WHERE id = $1 AND facilitator_id = $2`,
      [eventId, req.user!.sub]
    );

    if (!event) {
      res.status(404).json({ error: { message: 'Event not found', code: 'NOT_FOUND' } });
      return;
    }

    const { rows: existing } = await pool.query<{ email: string }>(
      `SELECT email FROM pf_invitations WHERE event_id = $1`,
      [eventId]
    );
    const existingEmails = new Set(existing.map((r) => r.email.toLowerCase()));

    let sent = 0;
    const skippedEmails: string[] = [];

    for (const attendee of attendees) {
      const email = attendee.email?.trim().toLowerCase();
      if (!email) continue;

      if (existingEmails.has(email)) {
        skippedEmails.push(email);
        continue;
      }

      const token = randomBytes(32).toString('hex');

      await pool.query(
        `INSERT INTO pf_invitations (event_id, email, first_name, last_name, token)
         VALUES ($1, $2, $3, $4, $5)`,
        [eventId, email, attendee.firstName ?? null, attendee.lastName ?? null, token]
      );

      await sendPFInvitationEmail(
        email,
        attendee.firstName ?? email,
        token,
        event.name,
        event.event_date,
        event.is_free
      ).catch((err: unknown) => console.error('[pf] invitation email failed:', err));

      existingEmails.add(email);
      sent++;
    }

    if (event.status === 'draft' && sent > 0) {
      await pool.query(
        `UPDATE pf_events SET status = 'active', updated_at = NOW() WHERE id = $1`,
        [eventId]
      );
    }

    res.status(201).json({ sent, skipped: skippedEmails.length, skippedEmails });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/pf/invitations/:invitationId/resend ────────────────────────────

export async function resendInvitation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { invitationId } = req.params;

    const { rows: [row] } = await pool.query<{
      email: string; first_name: string | null; token: string;
      event_name: string; event_date: Date | null; is_free: boolean;
    }>(
      `SELECT
         i.email, i.first_name, i.token,
         e.name AS event_name, e.event_date, e.is_free
       FROM pf_invitations i
       JOIN pf_events e ON e.id = i.event_id
       WHERE i.id = $1 AND e.facilitator_id = $2`,
      [invitationId, req.user!.sub]
    );

    if (!row) {
      res.status(404).json({ error: { message: 'Invitation not found', code: 'NOT_FOUND' } });
      return;
    }

    await sendPFInvitationEmail(
      row.email,
      row.first_name ?? row.email,
      row.token,
      row.event_name,
      row.event_date,
      row.is_free
    );

    res.json({ sent: true });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/pf/results/:resultId/resend-results ────────────────────────────

export async function resendResults(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { resultId } = req.params;

    const { rows: [row] } = await pool.query<{
      email: string; first_name: string | null; primary_profile: string; event_name: string;
    }>(
      `SELECT
         i.email, i.first_name, r.primary_profile, e.name AS event_name
       FROM pf_results r
       JOIN pf_invitations i ON i.id = r.invitation_id
       JOIN pf_events e ON e.id = r.event_id
       WHERE r.id = $1 AND e.facilitator_id = $2`,
      [resultId, req.user!.sub]
    );

    if (!row) {
      res.status(404).json({ error: { message: 'Result not found', code: 'NOT_FOUND' } });
      return;
    }

    const pfProfile = safePFProfile(row.primary_profile);

    await sendPFResultsEmail(
      row.email,
      row.first_name ?? row.email,
      pfProfile,
      row.event_name
    );

    await pool.query(
      `UPDATE pf_results SET results_email_sent = true, results_email_sent_at = NOW() WHERE id = $1`,
      [resultId]
    );

    res.json({ sent: true });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/pf/events/:eventId/results ──────────────────────────────────────

export async function listEventResults(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { eventId } = req.params;

    const { rows: [event] } = await pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM pf_events WHERE id = $1 AND facilitator_id = $2`,
      [eventId, req.user!.sub]
    );
    if (!event) {
      res.status(404).json({ error: { message: 'Event not found', code: 'NOT_FOUND' } });
      return;
    }

    const { rows: results } = await pool.query<{
      id: string; invitation_id: string; email: string;
      first_name: string | null; last_name: string | null;
      primary_profile: string; secondary_profile: string | null;
      assertiveness_score: number; responsiveness_score: number;
      completed_at: Date | null; results_email_sent: boolean;
    }>(
      `SELECT
         r.id, r.invitation_id, i.email, i.first_name, i.last_name,
         r.primary_profile, r.secondary_profile,
         r.assertiveness_score, r.responsiveness_score,
         i.completed_at, r.results_email_sent
       FROM pf_results r
       JOIN pf_invitations i ON i.id = r.invitation_id
       WHERE r.event_id = $1
       ORDER BY i.completed_at DESC`,
      [eventId]
    );

    const { rows: [totals] } = await pool.query<{
      total_invitations: string; completed_count: string;
    }>(
      `SELECT
         COUNT(*) AS total_invitations,
         COUNT(*) FILTER (WHERE status = 'completed') AS completed_count
       FROM pf_invitations WHERE event_id = $1`,
      [eventId]
    );

    const profileCounts: Record<string, number> = {};
    for (const r of results) {
      const name = displayName(r.primary_profile);
      profileCounts[name] = (profileCounts[name] ?? 0) + 1;
    }
    const profileBreakdown = Object.entries(profileCounts).map(([profile, count]) => ({ profile, count }));

    const totalInv   = parseInt(totals.total_invitations, 10);
    const completed  = parseInt(totals.completed_count, 10);
    const completionRate = totalInv > 0 ? Math.round((completed / totalInv) * 100) : 0;

    res.json({
      results: results.map((r) => ({
        id:                  r.id,
        invitationId:        r.invitation_id,
        email:               r.email,
        firstName:           r.first_name,
        lastName:            r.last_name,
        primaryProfile:      displayName(r.primary_profile),
        secondaryProfile:    r.secondary_profile ? displayName(r.secondary_profile) : null,
        assertivenessScore:  r.assertiveness_score,
        responsivenessScore: r.responsiveness_score,
        completedAt:         r.completed_at,
        resultsEmailSent:    r.results_email_sent,
      })),
      profileBreakdown,
      completionRate,
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/pf/results/:resultId ────────────────────────────────────────────

export async function getResult(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { resultId } = req.params;

    const { rows: [r] } = await pool.query<{
      id: string; invitation_id: string;
      email: string; first_name: string | null; last_name: string | null;
      event_id: string; event_name: string;
      primary_profile: string; secondary_profile: string | null;
      assertiveness_score: number; responsiveness_score: number;
      assertiveness_percentile: number; responsiveness_percentile: number;
      self_perspective: unknown; work_perspective: unknown; others_perspective: unknown;
      validity_flags: unknown; results_email_sent: boolean; results_email_sent_at: Date | null;
      raw_scoring_result: unknown; created_at: Date;
      completed_at: Date | null;
    }>(
      `SELECT
         r.id, r.invitation_id, i.email, i.first_name, i.last_name,
         r.event_id, e.name AS event_name,
         r.primary_profile, r.secondary_profile,
         r.assertiveness_score, r.responsiveness_score,
         r.assertiveness_percentile, r.responsiveness_percentile,
         r.self_perspective, r.work_perspective, r.others_perspective,
         r.validity_flags, r.results_email_sent, r.results_email_sent_at,
         r.raw_scoring_result, r.created_at,
         i.completed_at
       FROM pf_results r
       JOIN pf_invitations i ON i.id = r.invitation_id
       JOIN pf_events e ON e.id = r.event_id
       WHERE r.id = $1 AND e.facilitator_id = $2`,
      [resultId, req.user!.sub]
    );

    if (!r) {
      res.status(404).json({ error: { message: 'Result not found', code: 'NOT_FOUND' } });
      return;
    }

    res.json({
      id:                        r.id,
      invitationId:              r.invitation_id,
      email:                     r.email,
      firstName:                 r.first_name,
      lastName:                  r.last_name,
      eventId:                   r.event_id,
      eventName:                 r.event_name,
      primaryProfile:            displayName(r.primary_profile),
      secondaryProfile:          r.secondary_profile ? displayName(r.secondary_profile) : null,
      assertivenessScore:        r.assertiveness_score,
      responsivenessScore:       r.responsiveness_score,
      assertivenessPercentile:   r.assertiveness_percentile,
      responsivenessPercentile:  r.responsiveness_percentile,
      selfPerspective:           r.self_perspective,
      workPerspective:           r.work_perspective,
      othersPerspective:         r.others_perspective,
      validityFlags:             r.validity_flags,
      resultsEmailSent:          r.results_email_sent,
      resultsEmailSentAt:        r.results_email_sent_at,
      completedAt:               r.completed_at,
      createdAt:                 r.created_at,
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/pf/results (aggregate across all events) ────────────────────────

export async function listAllResults(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page  = Math.max(1, parseInt(String(req.query['page']  ?? '1'),  10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? '25'), 10)));
    const offset = (page - 1) * limit;

    const eventFilter   = req.query['eventId']   ? String(req.query['eventId'])   : null;
    const profileFilter = req.query['profile']   ? String(req.query['profile'])   : null;
    const typeFilter    = req.query['eventType'] ? String(req.query['eventType']) : null;
    const fromDate      = req.query['from']      ? String(req.query['from'])      : null;
    const toDate        = req.query['to']        ? String(req.query['to'])        : null;

    const conditions: string[] = ['e.facilitator_id = $1'];
    const params: unknown[]    = [req.user!.sub];

    function addParam(expr: string, val: unknown) {
      params.push(val);
      conditions.push(`${expr} = $${params.length}`);
    }

    if (eventFilter)   addParam('e.id',              eventFilter);
    if (profileFilter) addParam('r.primary_profile',  profileFilter.toLowerCase());
    if (typeFilter)    addParam('e.event_type',        typeFilter);
    if (fromDate)      { params.push(fromDate); conditions.push(`i.completed_at >= $${params.length}`); }
    if (toDate)        { params.push(toDate);   conditions.push(`i.completed_at <= $${params.length}`); }

    const where = conditions.join(' AND ');

    const [{ rows }, { rows: [countRow] }] = await Promise.all([
      pool.query<{
        id: string; invitation_id: string;
        email: string; first_name: string | null; last_name: string | null;
        event_id: string; event_name: string;
        primary_profile: string; secondary_profile: string | null;
        completed_at: Date | null;
      }>(
        `SELECT
           r.id, r.invitation_id, i.email, i.first_name, i.last_name,
           e.id AS event_id, e.name AS event_name,
           r.primary_profile, r.secondary_profile, i.completed_at
         FROM pf_results r
         JOIN pf_invitations i ON i.id = r.invitation_id
         JOIN pf_events e ON e.id = r.event_id
         WHERE ${where}
         ORDER BY i.completed_at DESC NULLS LAST
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total
         FROM pf_results r
         JOIN pf_invitations i ON i.id = r.invitation_id
         JOIN pf_events e ON e.id = r.event_id
         WHERE ${where}`,
        params
      ),
    ]);

    const total = parseInt(countRow?.total ?? '0', 10);

    const profileCounts: Record<string, number> = {};
    for (const r of rows) {
      const name = displayName(r.primary_profile);
      profileCounts[name] = (profileCounts[name] ?? 0) + 1;
    }

    res.json({
      results: rows.map((r) => ({
        id:              r.id,
        invitationId:    r.invitation_id,
        email:           r.email,
        firstName:       r.first_name,
        lastName:        r.last_name,
        eventId:         r.event_id,
        eventName:       r.event_name,
        primaryProfile:  displayName(r.primary_profile),
        secondaryProfile: r.secondary_profile ? displayName(r.secondary_profile) : null,
        completedAt:     r.completed_at,
      })),
      profileBreakdown: Object.entries(profileCounts).map(([profile, count]) => ({ profile, count })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/pf/test/create-test-invitation (dev/test only) ─────────────────

export async function createTestInvitation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } });
    return;
  }

  try {
    const { rows: [event] } = await pool.query<{ id: string }>(
      `INSERT INTO pf_events (name, event_type, facilitator_id, status, is_free)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['Test Couples Night', 'couples_night', req.user!.sub, 'active', true]
    );

    const token = randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO pf_invitations (event_id, email, first_name, last_name, token, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [event.id, req.user!.email, 'Test', 'Attendee', token, 'pending']
    );

    const url = process.env.VITE_PF_URL + '/assess/' + token;

    res.status(201).json({
      assessmentUrl: url,
      token,
      eventId: event.id,
      message: 'Visit the assessment URL to test the People First assessment flow.',
    });
  } catch (err) {
    next(err);
  }
}

// ── DTO helper ────────────────────────────────────────────────────────────────

function toEventDto(
  event: {
    id: string; name: string; event_type: string; facilitator_id: string;
    event_date: Date | null; location: string | null; is_free: boolean;
    notes: string | null; status: string; created_at: Date; updated_at: Date;
  },
  invitationCount: number,
  completedCount: number
) {
  return {
    id:              event.id,
    name:            event.name,
    eventType:       event.event_type,
    facilitatorId:   event.facilitator_id,
    eventDate:       event.event_date,
    location:        event.location,
    isFree:          event.is_free,
    notes:           event.notes,
    status:          event.status,
    invitationCount,
    completedCount,
    completionRate:  invitationCount > 0 ? Math.round((completedCount / invitationCount) * 100) : 0,
    createdAt:       event.created_at,
    updatedAt:       event.updated_at,
  };
}
