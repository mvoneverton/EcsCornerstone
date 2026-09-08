import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { requireActiveSubscription } from '../middleware/requireActiveSubscription';
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
import { unlockClientPath, validateGatedPathToken } from './pathHandlers';
import { getDashboard, getResultDetail } from './dashboardHandlers';

const router = Router();

// ── Public: gated service token validation ────────────────────────────────────
// Mounted BEFORE requireAuth — the signed token in the query string is the auth.
// Used by the Agent Placement / FCAIO landing pages before rendering content.
router.get('/validate-path-token', validateGatedPathToken);

// All remaining admin routes require authentication
router.use(requireAuth);

// ── Company ───────────────────────────────────────────────────────────────────

// Exempt from requireActiveSubscription — companies with a failed/lapsed
// payment must still be able to see their own company record.
router.get('/company', requireRole('company_admin', 'facilitator'), getCompany);
router.patch('/company', requireActiveSubscription, requireRole('company_admin'), updateCompany);

// ── Invitations ───────────────────────────────────────────────────────────────

/** Send an assessment invitation to a respondent */
router.post(
  '/invitations',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  invite
);

/** List all invitations for the company */
router.get(
  '/invitations',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  listInvitations
);

/** Cancel a pending invitation (expires the token immediately) */
router.delete(
  '/invitations/:id',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  cancelInvitation
);

/** Resend an invitation with a fresh token and 7-day expiry */
router.post(
  '/invitations/:id/resend',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  resendInvitation
);

// ── People ────────────────────────────────────────────────────────────────────

/** Paginated list of all people in the company */
router.get(
  '/people',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  listPeople
);

/** Full profile + assessment history for one person */
router.get(
  '/people/:id',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  getPerson
);

/** Update a person's name, role, or position */
router.patch(
  '/people/:id',
  requireActiveSubscription,
  requireRole('company_admin'),
  updatePerson
);

/** Soft-delete a person from the company */
router.delete(
  '/people/:id',
  requireActiveSubscription,
  requireRole('company_admin'),
  deletePerson
);

// ── Positions ─────────────────────────────────────────────────────────────────

router.get(
  '/positions',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  listPositions
);

router.post(
  '/positions',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  createPosition
);

router.get(
  '/positions/:id',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  getPosition
);

router.patch(
  '/positions/:id',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  updatePosition
);

router.post(
  '/positions/:id/finalize',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  finalizePosition
);

router.delete(
  '/positions/:id',
  requireActiveSubscription,
  requireRole('company_admin'),
  archivePosition
);

// ── Dashboard ─────────────────────────────────────────────────────────────────

router.get(
  '/dashboard',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  getDashboard
);

// ── Results ───────────────────────────────────────────────────────────────────

/** Aggregate + paginated completed assessment results */
router.get(
  '/results',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  listResults
);

/** Full detail for one result */
router.get(
  '/results/:resultId',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  getResultDetail
);

// ── Reports ───────────────────────────────────────────────────────────────────

/** Pre-signed S3 URL for a completed report PDF */
router.get(
  '/reports/:invitationId',
  requireActiveSubscription,
  requireRole('company_admin', 'facilitator'),
  adminGetReportUrl
);

// ── Client path unlocking (super_admin only) ──────────────────────────────────

router.post(
  '/clients/:id/unlock-path',
  requireActiveSubscription,
  requireRole('super_admin', 'company_admin'),
  unlockClientPath
);

export default router;
