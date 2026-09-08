import { Request, Response, NextFunction } from 'express';
import pool from '../db/client';

// ── GET /api/manager/positions ─────────────────────────────────────────────────
// Positions assigned to the current manager.

export async function listManagerPositions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rows } = await pool.query<{ id: string; title: string }>(
      `SELECT id, title FROM positions
       WHERE manager_id = $1 AND archived_at IS NULL
       ORDER BY created_at DESC`,
      [req.user!.sub]
    );
    res.json({ positions: rows.map((p) => ({ id: p.id, title: p.title })) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/manager/positions/:positionId ────────────────────────────────────
// Invitation summary + results for one of this manager's assigned positions.

export async function getManagerPosition(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { positionId } = req.params;

    const { rows: [position] } = await pool.query<{ id: string; title: string }>(
      `SELECT id, title FROM positions WHERE id = $1 AND manager_id = $2 AND archived_at IS NULL`,
      [positionId, req.user!.sub]
    );
    if (!position) {
      res.status(404).json({ error: { message: 'Position not found', code: 'NOT_FOUND' } });
      return;
    }

    const [{ rows: [summary] }, { rows: results }] = await Promise.all([
      pool.query<{ sent: string; completed: string; pending: string }>(
        `SELECT
           COUNT(*) AS sent,
           COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed,
           COUNT(*) FILTER (WHERE completed_at IS NULL AND expires_at > now()) AS pending
         FROM assessment_invitations WHERE position_id = $1`,
        [positionId]
      ),
      pool.query<{
        result_id: string; first_name: string; last_name: string;
        primary_profile: string; completed_at: Date; report_s3_key: string | null;
      }>(
        `SELECT ar.id AS result_id, u.first_name, u.last_name, ar.primary_profile,
                ai.completed_at, ar.report_s3_key
         FROM assessment_invitations ai
         JOIN assessment_results ar ON ar.invitation_id = ai.id
         JOIN users u ON u.id = ai.respondent_id
         WHERE ai.position_id = $1 AND ai.completed_at IS NOT NULL
         ORDER BY ai.completed_at DESC`,
        [positionId]
      ),
    ]);

    res.json({
      position,
      summary: {
        sent:      parseInt(summary?.sent      ?? '0', 10),
        completed: parseInt(summary?.completed ?? '0', 10),
        pending:   parseInt(summary?.pending   ?? '0', 10),
      },
      results: results.map((r) => ({
        id:             r.result_id,
        respondentName: `${r.first_name} ${r.last_name}`,
        primaryProfile: r.primary_profile,
        completedAt:    r.completed_at,
        hasReport:      r.report_s3_key !== null,
      })),
    });
  } catch (err) {
    next(err);
  }
}
