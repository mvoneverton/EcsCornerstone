import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import pool from '../db/client';
import { sendInvitationEmail } from '../auth/email';
import { hashPassword } from '../auth/password';
import { inviteSchema, listPeopleSchema, updatePersonSchema } from './schemas';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** All admin handlers require req.user — this is guaranteed by requireAuth upstream. */
function companyId(req: Request): string {
  // super_admins have no companyId — admin routes are company-scoped only
  if (!req.user?.companyId) throw Object.assign(new Error('Company context required'), { statusCode: 403 });
  return req.user.companyId;
}

// ── GET /api/admin/company ────────────────────────────────────────────────────

export async function getCompany(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid = companyId(req);
    const { rows: [row] } = await pool.query<{
      id:                  string;
      name:                string;
      slug:                string;
      subscription_status: string;
      plan_name:           string;
      assessment_limit_monthly: number | null;
    }>(
      `SELECT c.id, c.name, c.slug, c.subscription_status,
              p.name AS plan_name, p.assessment_limit_monthly
       FROM companies c
       JOIN plans p ON p.id = c.plan_id
       WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [cid]
    );
    if (!row) {
      res.status(404).json({ error: { message: 'Company not found' } });
      return;
    }
    res.json({
      id:                 row.id,
      name:               row.name,
      slug:               row.slug,
      subscriptionStatus: row.subscription_status,
      plan: {
        name:            row.plan_name,
        assessmentLimit: row.assessment_limit_monthly,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/company ──────────────────────────────────────────────────

export async function updateCompany(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid  = companyId(req);
    const name = (req.body?.name ?? '').toString().trim();

    if (!name) {
      res.status(400).json({ error: { message: 'Company name is required' } });
      return;
    }
    if (name.length > 120) {
      res.status(400).json({ error: { message: 'Company name must be 120 characters or fewer' } });
      return;
    }

    await pool.query(
      `UPDATE companies SET name = $1, updated_at = now() WHERE id = $2 AND deleted_at IS NULL`,
      [name, cid]
    );

    res.json({ message: 'Updated' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/invitations ───────────────────────────────────────────────

export async function invite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid = companyId(req);

    const body = inviteSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { message: 'Validation failed', details: body.error.flatten() } });
      return;
    }

    const { email, firstName, lastName, assessmentType, positionId, currentPosition } = body.data;

    // ── 1. Verify positionId belongs to this company (JA) ────────────────────
    if (positionId) {
      const { rows: posRows } = await pool.query<{ id: string }>(
        `SELECT id FROM positions
         WHERE id = $1 AND company_id = $2 AND archived_at IS NULL`,
        [positionId, cid]
      );
      if (posRows.length === 0) {
        res.status(404).json({ error: { message: 'Position not found', code: 'POSITION_NOT_FOUND' } });
        return;
      }
    }

    // ── 2. Check monthly invitation limit ─────────────────────────────────────
    const { rows: [planRow] } = await pool.query<{
      assessment_limit_monthly: number | null;
    }>(
      `SELECT p.assessment_limit_monthly
       FROM companies c
       JOIN plans p ON p.id = c.plan_id
       WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [cid]
    );

    if (planRow?.assessment_limit_monthly !== null && planRow?.assessment_limit_monthly !== undefined) {
      const { rows: [usageRow] } = await pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM assessment_invitations
         WHERE company_id = $1
           AND created_at >= date_trunc('month', now())`,
        [cid]
      );
      const usage = parseInt(usageRow?.count ?? '0', 10);
      if (usage >= planRow.assessment_limit_monthly) {
        res.status(402).json({
          error: {
            message: 'Monthly assessment limit reached. Upgrade your plan to send more invitations.',
            code: 'LIMIT_REACHED',
          },
        });
        return;
      }
    }

    // ── 3. Find or create respondent user ─────────────────────────────────────
    const { rows: existingUsers } = await pool.query<{
      id: string; company_id: string | null;
    }>(
      `SELECT id, company_id FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
      [email.toLowerCase()]
    );

    let respondentId: string;

    if (existingUsers.length > 0) {
      respondentId = existingUsers[0]!.id;
    } else {
      // Create a new respondent — generate a temporary password they'll reset via email
      const tempHash = await hashPassword(randomBytes(16).toString('hex'));
      const { rows: [newUser] } = await pool.query<{ id: string }>(
        `INSERT INTO users
           (company_id, email, password_hash, role, first_name, last_name, current_position, invited_by)
         VALUES ($1, $2, $3, 'respondent', $4, $5, $6, $7)
         RETURNING id`,
        [cid, email.toLowerCase(), tempHash, firstName, lastName, currentPosition ?? null, req.user!.sub]
      );
      respondentId = newUser!.id;
    }

    // ── 4. Create invitation ───────────────────────────────────────────────────
    const token     = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { rows: [invitation] } = await pool.query<{
      id: string;
      token: string;
      assessment_type: string;
      expires_at: Date;
      sent_at: Date;
    }>(
      `INSERT INTO assessment_invitations
         (company_id, respondent_id, assessment_type, token, sent_by, expires_at, position_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, token, assessment_type, expires_at, sent_at`,
      [cid, respondentId, assessmentType, token, req.user!.sub, expiresAt, positionId ?? null]
    );

    // ── 5. Send invitation email (non-blocking) ───────────────────────────────
    const senderName = `${req.user!.email}`; // will be replaced with actual name in Step 6
    sendInvitationEmail(email, senderName, token, assessmentType).catch((err) =>
      console.error('[admin] invitation email error:', err)
    );

    res.status(201).json({ invitation: invitation! });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/people ─────────────────────────────────────────────────────

export async function listPeople(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid = companyId(req);

    const query = listPeopleSchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: { message: 'Invalid query parameters', details: query.error.flatten() } });
      return;
    }

    const { page, limit, search, role } = query.data;
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clauses — always include company_id
    const conditions: string[] = ['u.company_id = $1', 'u.deleted_at IS NULL'];
    const params: unknown[] = [cid];
    let paramIdx = 2;

    if (search) {
      conditions.push(
        `(u.first_name ILIKE $${paramIdx} OR u.last_name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx})`
      );
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (role) {
      conditions.push(`u.role = $${paramIdx}`);
      params.push(role);
      paramIdx++;
    }

    const where = conditions.join(' AND ');

    const [{ rows: people }, { rows: [countRow] }] = await Promise.all([
      pool.query<{
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        role: string;
        current_position: string | null;
        last_login_at: Date | null;
        created_at: Date;
        completed_assessments: string;
      }>(
        `SELECT
           u.id,
           u.email,
           u.first_name,
           u.last_name,
           u.role,
           u.current_position,
           u.last_login_at,
           u.created_at,
           COUNT(ai.id) FILTER (WHERE ai.completed_at IS NOT NULL) AS completed_assessments
         FROM users u
         LEFT JOIN assessment_invitations ai
           ON ai.respondent_id = u.id AND ai.company_id = $1
         WHERE ${where}
         GROUP BY u.id
         ORDER BY u.created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total
         FROM users u
         WHERE ${where}`,
        params
      ),
    ]);

    const total = parseInt(countRow?.total ?? '0', 10);

    res.json({
      people: people.map((p) => ({
        id:                   p.id,
        email:                p.email,
        firstName:            p.first_name,
        lastName:             p.last_name,
        role:                 p.role,
        currentPosition:      p.current_position,
        lastLoginAt:          p.last_login_at,
        createdAt:            p.created_at,
        completedAssessments: parseInt(p.completed_assessments, 10),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/people/:id ─────────────────────────────────────────────────

export async function getPerson(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid    = companyId(req);
    const userId = req.params['id'];

    // User must belong to this company
    const { rows: [user] } = await pool.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      current_position: string | null;
      last_login_at: Date | null;
      created_at: Date;
      facilitator_notes: string | null;
    }>(
      `SELECT id, email, first_name, last_name, role, current_position, last_login_at, created_at, facilitator_notes
       FROM users
       WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [userId, cid]
    );

    if (!user) {
      res.status(404).json({ error: { message: 'Person not found', code: 'NOT_FOUND' } });
      return;
    }

    // Invitations for this user within this company (raw responses never returned)
    const { rows: invitations } = await pool.query<{
      id: string;
      assessment_type: string;
      sent_at: Date;
      expires_at: Date;
      opened_at: Date | null;
      completed_at: Date | null;
      position_id: string | null;
      // result columns (null when not yet completed)
      perspective: string | null;
      a_percentile: number | null;
      r_percentile: number | null;
      a_score_800: number | null;
      r_score_800: number | null;
      primary_profile: string | null;
      secondary_profile: string | null;
      report_s3_key: string | null;
      is_valid: boolean | null;
      validity_flags: unknown[] | null;
    }>(
      `SELECT
         ai.id,
         ai.assessment_type,
         ai.sent_at,
         ai.expires_at,
         ai.opened_at,
         ai.completed_at,
         ai.position_id,
         ar.perspective,
         ar.a_percentile,
         ar.r_percentile,
         ar.a_score_800,
         ar.r_score_800,
         ar.primary_profile,
         ar.secondary_profile,
         ar.report_s3_key,
         ar.is_valid,
         ar.validity_flags
       FROM assessment_invitations ai
       LEFT JOIN assessment_results ar ON ar.invitation_id = ai.id
       WHERE ai.company_id = $1
         AND ai.respondent_id = $2
       ORDER BY ai.sent_at DESC`,
      [cid, userId]
    );

    // Group results by invitation (PCA has 3 perspectives per invitation)
    const invMap = new Map<string, {
      id: string;
      assessmentType: string;
      sentAt: Date;
      expiresAt: Date;
      openedAt: Date | null;
      completedAt: Date | null;
      positionId: string | null;
      results: unknown[];
    }>();

    for (const row of invitations) {
      if (!invMap.has(row.id)) {
        invMap.set(row.id, {
          id:             row.id,
          assessmentType: row.assessment_type,
          sentAt:         row.sent_at,
          expiresAt:      row.expires_at,
          openedAt:       row.opened_at,
          completedAt:    row.completed_at,
          positionId:     row.position_id,
          results:        [],
        });
      }
      if (row.perspective !== null) {
        invMap.get(row.id)!.results.push({
          perspective:      row.perspective,
          aPercentile:      row.a_percentile,
          rPercentile:      row.r_percentile,
          aScore800:        row.a_score_800,
          rScore800:        row.r_score_800,
          primaryProfile:   row.primary_profile,
          secondaryProfile: row.secondary_profile,
          reportS3Key:      row.report_s3_key,
          isValid:          row.is_valid,
          validityFlags:    row.validity_flags,
        });
      }
    }

    res.json({
      person: {
        id:                user.id,
        email:             user.email,
        firstName:         user.first_name,
        lastName:          user.last_name,
        role:              user.role,
        currentPosition:   user.current_position,
        lastLoginAt:       user.last_login_at,
        createdAt:         user.created_at,
        facilitatorNotes:  user.facilitator_notes,
      },
      assessments: Array.from(invMap.values()),
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/people/:id ───────────────────────────────────────────────

export async function updatePerson(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid    = companyId(req);
    const userId = req.params['id'];

    const body = updatePersonSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { message: 'Validation failed', details: body.error.flatten() } });
      return;
    }

    const updates = body.data;
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: { message: 'No fields to update', code: 'NO_CHANGES' } });
      return;
    }

    // Cannot elevate another user to super_admin via this route
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const params: unknown[]    = [];
    let paramIdx = 1;

    if (updates.firstName !== undefined) {
      setClauses.push(`first_name = $${paramIdx++}`);
      params.push(updates.firstName);
    }
    if (updates.lastName !== undefined) {
      setClauses.push(`last_name = $${paramIdx++}`);
      params.push(updates.lastName);
    }
    if (updates.currentPosition !== undefined) {
      setClauses.push(`current_position = $${paramIdx++}`);
      params.push(updates.currentPosition);
    }
    if (updates.role !== undefined) {
      setClauses.push(`role = $${paramIdx++}`);
      params.push(updates.role);
    }
    if (updates.facilitatorNotes !== undefined) {
      setClauses.push(`facilitator_notes = $${paramIdx++}`);
      params.push(updates.facilitatorNotes);
    }

    setClauses.push(`updated_at = now()`);

    params.push(userId, cid); // WHERE clause params

    const { rows: [updated] } = await pool.query<{ id: string }>(
      `UPDATE users
       SET ${setClauses.join(', ')}
       WHERE id = $${paramIdx} AND company_id = $${paramIdx + 1} AND deleted_at IS NULL
       RETURNING id`,
      params
    );

    if (!updated) {
      res.status(404).json({ error: { message: 'Person not found', code: 'NOT_FOUND' } });
      return;
    }

    res.json({ message: 'Updated successfully' });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/admin/people/:id ──────────────────────────────────────────────

export async function deletePerson(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid    = companyId(req);
    const userId = req.params['id'];

    if (userId === req.user!.sub) {
      res.status(400).json({ error: { message: 'You cannot delete your own account', code: 'SELF_DELETE' } });
      return;
    }

    // Soft delete — company_id filter enforced
    const { rows: [deleted] } = await pool.query<{ id: string }>(
      `UPDATE users
       SET deleted_at = now(), updated_at = now()
       WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [userId, cid]
    );

    if (!deleted) {
      res.status(404).json({ error: { message: 'Person not found', code: 'NOT_FOUND' } });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/positions ──────────────────────────────────────────────────

export async function listPositions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid = companyId(req);

    const { rows } = await pool.query<{
      id:                     string;
      title:                  string;
      status:                 string;
      consensus_a_percentile: number | null;
      consensus_r_percentile: number | null;
      finalized_at:           Date | null;
      created_at:             Date;
      ja_count:               string;
      completed_count:        string;
    }>(
      `SELECT
         p.id,
         p.title,
         p.status,
         p.consensus_a_percentile,
         p.consensus_r_percentile,
         p.finalized_at,
         p.created_at,
         COUNT(ai.id) AS ja_count,
         COUNT(ai.id) FILTER (WHERE ai.completed_at IS NOT NULL) AS completed_count
       FROM positions p
       LEFT JOIN assessment_invitations ai
         ON ai.position_id = p.id AND ai.assessment_type = 'ja'
       WHERE p.company_id = $1
         AND p.archived_at IS NULL
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [cid]
    );

    res.json({
      positions: rows.map((r) => ({
        id:                    r.id,
        title:                 r.title,
        status:                r.status,
        consensusAPercentile:  r.consensus_a_percentile,
        consensusRPercentile:  r.consensus_r_percentile,
        finalizedAt:           r.finalized_at,
        createdAt:             r.created_at,
        jaCount:               parseInt(r.ja_count, 10),
        completedCount:        parseInt(r.completed_count, 10),
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/positions ─────────────────────────────────────────────────

export async function createPosition(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid   = companyId(req);
    const title = (req.body?.title ?? '').toString().trim();

    if (!title) {
      res.status(400).json({ error: { message: 'Title is required', code: 'VALIDATION_FAILED' } });
      return;
    }
    if (title.length > 120) {
      res.status(400).json({ error: { message: 'Title must be 120 characters or fewer', code: 'VALIDATION_FAILED' } });
      return;
    }

    const { rows: [position] } = await pool.query<{ id: string; title: string; status: string; created_at: Date }>(
      `INSERT INTO positions (company_id, title) VALUES ($1, $2) RETURNING id, title, status, created_at`,
      [cid, title]
    );

    res.status(201).json({ position: position! });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/positions/:id ──────────────────────────────────────────────

export async function getPosition(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid = companyId(req);
    const pid = req.params['id'];

    const { rows: [pos] } = await pool.query<{
      id:                     string;
      title:                  string;
      status:                 string;
      consensus_a_percentile: number | null;
      consensus_r_percentile: number | null;
      finalized_at:           Date | null;
      created_at:             Date;
    }>(
      `SELECT id, title, status, consensus_a_percentile, consensus_r_percentile,
              finalized_at, created_at
       FROM positions
       WHERE id = $1 AND company_id = $2 AND archived_at IS NULL`,
      [pid, cid]
    );

    if (!pos) {
      res.status(404).json({ error: { message: 'Position not found', code: 'NOT_FOUND' } });
      return;
    }

    // JA invitations for this position
    const { rows: invitations } = await pool.query<{
      id:            string;
      respondent_id: string;
      first_name:    string;
      last_name:     string;
      email:         string;
      sent_at:       Date;
      opened_at:     Date | null;
      completed_at:  Date | null;
      expires_at:    Date;
      // result columns
      a_percentile:  number | null;
      r_percentile:  number | null;
      a_score_800:   number | null;
      r_score_800:   number | null;
      primary_profile: string | null;
    }>(
      `SELECT
         ai.id,
         u.id AS respondent_id,
         u.first_name,
         u.last_name,
         u.email,
         ai.sent_at,
         ai.opened_at,
         ai.completed_at,
         ai.expires_at,
         ar.a_percentile,
         ar.r_percentile,
         ar.a_score_800,
         ar.r_score_800,
         ar.primary_profile
       FROM assessment_invitations ai
       JOIN users u ON u.id = ai.respondent_id
       LEFT JOIN assessment_results ar ON ar.invitation_id = ai.id AND ar.perspective = 'job'
       WHERE ai.position_id = $1
         AND ai.assessment_type = 'ja'
       ORDER BY ai.sent_at DESC`,
      [pid]
    );

    res.json({
      position: {
        id:                   pos.id,
        title:                pos.title,
        status:               pos.status,
        consensusAPercentile: pos.consensus_a_percentile,
        consensusRPercentile: pos.consensus_r_percentile,
        finalizedAt:          pos.finalized_at,
        createdAt:            pos.created_at,
      },
      invitations: invitations.map((i) => ({
        id:             i.id,
        respondentId:   i.respondent_id,
        firstName:      i.first_name,
        lastName:       i.last_name,
        email:          i.email,
        sentAt:         i.sent_at,
        openedAt:       i.opened_at,
        completedAt:    i.completed_at,
        expiresAt:      i.expires_at,
        aPercentile:    i.a_percentile,
        rPercentile:    i.r_percentile,
        aScore800:      i.a_score_800,
        rScore800:      i.r_score_800,
        primaryProfile: i.primary_profile,
        status: i.completed_at
          ? 'completed'
          : new Date(i.expires_at) <= new Date()
          ? 'expired'
          : 'pending',
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/positions/:id ────────────────────────────────────────────

export async function updatePosition(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid   = companyId(req);
    const pid   = req.params['id'];
    const title = (req.body?.title ?? '').toString().trim();

    if (!title) {
      res.status(400).json({ error: { message: 'Title is required' } });
      return;
    }

    const { rows: [updated] } = await pool.query<{ id: string }>(
      `UPDATE positions SET title = $1, updated_at = now()
       WHERE id = $2 AND company_id = $3 AND archived_at IS NULL
       RETURNING id`,
      [title, pid, cid]
    );

    if (!updated) {
      res.status(404).json({ error: { message: 'Position not found', code: 'NOT_FOUND' } });
      return;
    }

    res.json({ message: 'Updated' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/positions/:id/finalize ────────────────────────────────────
// Computes consensus A/R percentile from all completed JA responses for this
// position and marks the position as finalized.

export async function finalizePosition(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid = companyId(req);
    const pid = req.params['id'];

    const { rows: [pos] } = await pool.query<{ id: string; status: string }>(
      `SELECT id, status FROM positions
       WHERE id = $1 AND company_id = $2 AND archived_at IS NULL`,
      [pid, cid]
    );

    if (!pos) {
      res.status(404).json({ error: { message: 'Position not found', code: 'NOT_FOUND' } });
      return;
    }

    if (pos.status === 'finalized') {
      res.status(409).json({ error: { message: 'Position is already finalized', code: 'ALREADY_FINALIZED' } });
      return;
    }

    // Compute consensus as mean of completed JA results (job perspective)
    const { rows: [consensus] } = await pool.query<{
      avg_a: number | null;
      avg_r: number | null;
      count: string;
    }>(
      `SELECT
         AVG(ar.a_percentile) AS avg_a,
         AVG(ar.r_percentile) AS avg_r,
         COUNT(*) AS count
       FROM assessment_invitations ai
       JOIN assessment_results ar ON ar.invitation_id = ai.id AND ar.perspective = 'job'
       WHERE ai.position_id = $1
         AND ai.assessment_type = 'ja'
         AND ai.completed_at IS NOT NULL`,
      [pid]
    );

    const count = parseInt(consensus?.count ?? '0', 10);
    if (count === 0) {
      res.status(422).json({
        error: {
          message: 'At least one completed JA assessment is required before finalizing',
          code: 'NO_RESPONSES',
        },
      });
      return;
    }

    const { rows: [updated] } = await pool.query<{
      id: string;
      consensus_a_percentile: number;
      consensus_r_percentile: number;
    }>(
      `UPDATE positions
       SET status = 'finalized',
           consensus_a_percentile = $1,
           consensus_r_percentile = $2,
           finalized_at = now(),
           finalized_by = $3,
           updated_at = now()
       WHERE id = $4 AND company_id = $5
       RETURNING id, consensus_a_percentile, consensus_r_percentile`,
      [consensus!.avg_a, consensus!.avg_r, req.user!.sub, pid, cid]
    );

    res.json({
      positionId:           updated!.id,
      consensusAPercentile: updated!.consensus_a_percentile,
      consensusRPercentile: updated!.consensus_r_percentile,
      respondentCount:      count,
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/admin/positions/:id ───────────────────────────────────────────

export async function archivePosition(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid = companyId(req);
    const pid = req.params['id'];

    const { rows: [archived] } = await pool.query<{ id: string }>(
      `UPDATE positions SET archived_at = now(), updated_at = now()
       WHERE id = $1 AND company_id = $2 AND archived_at IS NULL
       RETURNING id`,
      [pid, cid]
    );

    if (!archived) {
      res.status(404).json({ error: { message: 'Position not found', code: 'NOT_FOUND' } });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/results ────────────────────────────────────────────────────
// Returns completed assessment results with optional filters.
// Also returns aggregate profile distribution counts.

export async function listResults(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid = companyId(req);

    const page           = Math.max(1, parseInt(String(req.query['page']    ?? '1'),  10));
    const limit          = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? '25'), 10)));
    const offset         = (page - 1) * limit;
    const profileFilter  = req.query['profile']  as string | undefined;
    const typeFilter     = req.query['type']      as string | undefined; // 'pca' | 'wsa' | 'ja'
    const dateFrom       = req.query['dateFrom']  as string | undefined;
    const dateTo         = req.query['dateTo']    as string | undefined;
    const perspectiveFilter  = req.query['perspective']     as string | undefined;
    const respondentSearch   = req.query['respondentSearch'] as string | undefined;

    const conditions: string[] = [
      'ai.company_id = $1',
      'ai.completed_at IS NOT NULL',
      'ar.is_valid = true',
    ];
    const params: unknown[] = [cid];
    let paramIdx = 2;

    if (profileFilter) {
      conditions.push(`ar.primary_profile = $${paramIdx++}`);
      params.push(profileFilter);
    }
    if (typeFilter) {
      conditions.push(`ai.assessment_type = $${paramIdx++}`);
      params.push(typeFilter);
    }
    if (perspectiveFilter) {
      conditions.push(`ar.perspective = $${paramIdx++}`);
      params.push(perspectiveFilter);
    }
    if (respondentSearch) {
      conditions.push(
        `(u.first_name ILIKE $${paramIdx} OR u.last_name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx})`
      );
      params.push(`%${respondentSearch}%`);
      paramIdx++;
    }
    if (dateFrom) {
      conditions.push(`ai.completed_at >= $${paramIdx++}`);
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push(`ai.completed_at < $${paramIdx++}`);
      params.push(dateTo);
    }

    const where = conditions.join(' AND ');

    const [{ rows: results }, { rows: [countRow] }, { rows: distribution }] = await Promise.all([
      pool.query<{
        invitation_id:    string;
        assessment_type:  string;
        completed_at:     Date;
        respondent_id:    string;
        first_name:       string;
        last_name:        string;
        email:            string;
        perspective:      string;
        a_percentile:     number;
        r_percentile:     number;
        a_score_800:      number;
        r_score_800:      number;
        primary_profile:  string;
        secondary_profile: string | null;
        report_s3_key:    string | null;
      }>(
        `SELECT
           ai.id AS invitation_id,
           ai.assessment_type,
           ai.completed_at,
           u.id AS respondent_id,
           u.first_name,
           u.last_name,
           u.email,
           ar.perspective,
           ar.a_percentile,
           ar.r_percentile,
           ar.a_score_800,
           ar.r_score_800,
           ar.primary_profile,
           ar.secondary_profile,
           ar.report_s3_key
         FROM assessment_invitations ai
         JOIN users u ON u.id = ai.respondent_id
         JOIN assessment_results ar ON ar.invitation_id = ai.id
         WHERE ${where}
         ORDER BY ai.completed_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total
         FROM assessment_invitations ai
         JOIN assessment_results ar ON ar.invitation_id = ai.id
         WHERE ${where}`,
        params
      ),
      // Profile distribution — always scoped to company, not filtered
      pool.query<{ primary_profile: string; count: string }>(
        `SELECT ar.primary_profile, COUNT(*) AS count
         FROM assessment_invitations ai
         JOIN assessment_results ar ON ar.invitation_id = ai.id
         WHERE ai.company_id = $1
           AND ai.completed_at IS NOT NULL
           AND ar.is_valid = true
         GROUP BY ar.primary_profile`,
        [cid]
      ),
    ]);

    const total = parseInt(countRow?.total ?? '0', 10);

    const dist: Record<string, number> = {};
    for (const row of distribution) {
      dist[row.primary_profile] = parseInt(row.count, 10);
    }

    res.json({
      results: results.map((r) => ({
        invitationId:     r.invitation_id,
        assessmentType:   r.assessment_type,
        completedAt:      r.completed_at,
        respondent: {
          id:        r.respondent_id,
          firstName: r.first_name,
          lastName:  r.last_name,
          email:     r.email,
        },
        perspective:      r.perspective,
        aPercentile:      r.a_percentile,
        rPercentile:      r.r_percentile,
        aScore800:        r.a_score_800,
        rScore800:        r.r_score_800,
        primaryProfile:   r.primary_profile,
        secondaryProfile: r.secondary_profile,
        reportS3Key:      r.report_s3_key,
      })),
      distribution: dist,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/admin/invitations/:id ────────────────────────────────────────

export async function cancelInvitation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid          = companyId(req);
    const invitationId = req.params['id'];

    const { rows: [row] } = await pool.query<{ id: string; completed_at: Date | null }>(
      `SELECT id, completed_at FROM assessment_invitations
       WHERE id = $1 AND company_id = $2`,
      [invitationId, cid]
    );

    if (!row) {
      res.status(404).json({ error: { message: 'Invitation not found', code: 'NOT_FOUND' } });
      return;
    }
    if (row.completed_at) {
      res.status(400).json({ error: { message: 'Cannot cancel a completed assessment', code: 'ALREADY_COMPLETED' } });
      return;
    }

    // Expire the token immediately so the link stops working
    await pool.query(
      `UPDATE assessment_invitations
       SET expires_at = now() - interval '1 second', updated_at = now()
       WHERE id = $1`,
      [invitationId]
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/invitations/:id/resend ────────────────────────────────────

export async function resendInvitation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid          = companyId(req);
    const invitationId = req.params['id'];

    const { rows: [row] } = await pool.query<{
      id:              string;
      assessment_type: string;
      completed_at:    Date | null;
      email:           string;
    }>(
      `SELECT ai.id, ai.assessment_type, ai.completed_at, u.email
       FROM assessment_invitations ai
       JOIN users u ON u.id = ai.respondent_id
       WHERE ai.id = $1 AND ai.company_id = $2`,
      [invitationId, cid]
    );

    if (!row) {
      res.status(404).json({ error: { message: 'Invitation not found', code: 'NOT_FOUND' } });
      return;
    }
    if (row.completed_at) {
      res.status(400).json({ error: { message: 'Cannot resend a completed assessment', code: 'ALREADY_COMPLETED' } });
      return;
    }

    const newToken     = randomBytes(32).toString('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE assessment_invitations
       SET token = $1, expires_at = $2, sent_at = now(), updated_at = now()
       WHERE id = $3`,
      [newToken, newExpiresAt, invitationId]
    );

    const senderName = req.user!.email;
    sendInvitationEmail(row.email, senderName, newToken, row.assessment_type).catch((err) =>
      console.error('[admin] resend invitation email error:', err)
    );

    res.json({ message: 'Invitation resent successfully' });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/invitations ────────────────────────────────────────────────

export async function listInvitations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid = companyId(req);

    const page   = Math.max(1, parseInt(String(req.query['page']  ?? '1'),  10));
    const limit  = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? '20'), 10)));
    const offset = (page - 1) * limit;
    const status = req.query['status'] as string | undefined; // 'pending' | 'completed' | 'expired'

    const conditions: string[] = ['ai.company_id = $1'];
    const params: unknown[]    = [cid];
    let paramIdx = 2;

    if (status === 'completed') {
      conditions.push('ai.completed_at IS NOT NULL');
    } else if (status === 'pending') {
      conditions.push('ai.completed_at IS NULL AND ai.expires_at > now()');
    } else if (status === 'expired') {
      conditions.push('ai.completed_at IS NULL AND ai.expires_at <= now()');
    }

    const where = conditions.join(' AND ');

    const [{ rows: invitations }, { rows: [countRow] }] = await Promise.all([
      pool.query<{
        id: string;
        assessment_type: string;
        sent_at: Date;
        expires_at: Date;
        opened_at: Date | null;
        completed_at: Date | null;
        respondent_email: string;
        respondent_first: string;
        respondent_last: string;
      }>(
        `SELECT
           ai.id,
           ai.assessment_type,
           ai.sent_at,
           ai.expires_at,
           ai.opened_at,
           ai.completed_at,
           u.email   AS respondent_email,
           u.first_name AS respondent_first,
           u.last_name  AS respondent_last
         FROM assessment_invitations ai
         JOIN users u ON u.id = ai.respondent_id
         WHERE ${where}
         ORDER BY ai.sent_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total
         FROM assessment_invitations ai
         WHERE ${where}`,
        params
      ),
    ]);

    const total = parseInt(countRow?.total ?? '0', 10);

    res.json({
      invitations: invitations.map((i) => ({
        id:             i.id,
        assessmentType: i.assessment_type,
        sentAt:         i.sent_at,
        expiresAt:      i.expires_at,
        openedAt:       i.opened_at,
        completedAt:    i.completed_at,
        respondent: {
          email:     i.respondent_email,
          firstName: i.respondent_first,
          lastName:  i.respondent_last,
        },
        status: i.completed_at
          ? 'completed'
          : new Date(i.expires_at) <= new Date()
          ? 'expired'
          : 'pending',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}
