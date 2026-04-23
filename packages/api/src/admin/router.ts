import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import {
  getCompany,
  updateCompany,
  invite,
  cancelInvitation,
  resendInvitation,
  listPeople,
  getPerson,
  updatePerson,
  deletePerson,
  listInvitations,
  listResults,
  listPositions,
  createPosition,
  getPosition,
  updatePosition,
  finalizePosition,
  archivePosition,
} from './handlers';
import { adminGetReportUrl } from '../reports/handlers';
import { unlockClientPath } from './pathHandlers';

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

// ── Company ───────────────────────────────────────────────────────────────────

router.get('/company', requireRole('company_admin', 'facilitator'), getCompany);
router.patch('/company', requireRole('company_admin'), updateCompany);

// ── Invitations ───────────────────────────────────────────────────────────────

/** Send an assessment invitation to a respondent */
router.post(
  '/invitations',
  requireRole('company_admin', 'facilitator'),
  invite
);

/** List all invitations for the company */
router.get(
  '/invitations',
  requireRole('company_admin', 'facilitator'),
  listInvitations
);

/** Cancel a pending invitation (expires the token immediately) */
router.delete(
  '/invitations/:id',
  requireRole('company_admin', 'facilitator'),
  cancelInvitation
);

/** Resend an invitation with a fresh token and 7-day expiry */
router.post(
  '/invitations/:id/resend',
  requireRole('company_admin', 'facilitator'),
  resendInvitation
);

// ── People ────────────────────────────────────────────────────────────────────

/** Paginated list of all people in the company */
router.get(
  '/people',
  requireRole('company_admin', 'facilitator'),
  listPeople
);

/** Full profile + assessment history for one person */
router.get(
  '/people/:id',
  requireRole('company_admin', 'facilitator'),
  getPerson
);

/** Update a person's name, role, or position */
router.patch(
  '/people/:id',
  requireRole('company_admin'),
  updatePerson
);

/** Soft-delete a person from the company */
router.delete(
  '/people/:id',
  requireRole('company_admin'),
  deletePerson
);

// ── Positions ─────────────────────────────────────────────────────────────────

router.get(
  '/positions',
  requireRole('company_admin', 'facilitator'),
  listPositions
);

router.post(
  '/positions',
  requireRole('company_admin', 'facilitator'),
  createPosition
);

router.get(
  '/positions/:id',
  requireRole('company_admin', 'facilitator'),
  getPosition
);

router.patch(
  '/positions/:id',
  requireRole('company_admin', 'facilitator'),
  updatePosition
);

router.post(
  '/positions/:id/finalize',
  requireRole('company_admin', 'facilitator'),
  finalizePosition
);

router.delete(
  '/positions/:id',
  requireRole('company_admin'),
  archivePosition
);

// ── Results ───────────────────────────────────────────────────────────────────

/** Aggregate + paginated completed assessment results */
router.get(
  '/results',
  requireRole('company_admin', 'facilitator'),
  listResults
);

// ── Reports ───────────────────────────────────────────────────────────────────

/** Pre-signed S3 URL for a completed report PDF */
router.get(
  '/reports/:invitationId',
  requireRole('company_admin', 'facilitator'),
  adminGetReportUrl
);

// ── Client path unlocking (super_admin only) ──────────────────────────────────

router.post(
  '/clients/:id/unlock-path',
  requireRole('super_admin', 'company_admin'),
  unlockClientPath
);

export default router;
