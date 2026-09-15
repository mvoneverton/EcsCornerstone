import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireFacilitator } from './middleware';
import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  inviteAttendees,
  resendInvitation,
  resendResults,
  listEventResults,
  getResult,
  listAllResults,
  createTestInvitation,
} from './handlers';

const router = Router();

router.use(requireAuth, requireFacilitator);

// Events
router.post('/events',            createEvent);
router.get('/events',             listEvents);
router.get('/events/:eventId',    getEvent);
router.patch('/events/:eventId',  updateEvent);
router.delete('/events/:eventId', deleteEvent);

// Invitations
router.post('/events/:eventId/invite',            inviteAttendees);
router.post('/invitations/:invitationId/resend',  resendInvitation);

// Results
router.get('/events/:eventId/results',       listEventResults);
router.get('/results',                       listAllResults);
router.get('/results/:resultId',             getResult);
router.post('/results/:resultId/resend-results', resendResults);

// Dev/test only
router.get('/test/create-test-invitation', createTestInvitation);

export default router;
