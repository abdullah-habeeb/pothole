import express from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import {
  createGovRequest,
  getAllGovRequests,
  getMyGovRequest,
  approveGovRequest,
  rejectGovRequest,
} from '../controllers/govRequest.controller.js';

const router = express.Router();

// Create a new government authorization request
router.post('/create', requireAuth, createGovRequest);

// Get user's own request status
router.get('/my-request', requireAuth, getMyGovRequest);

// Admin only routes
router.get('/all', requireAuth, getAllGovRequests);
router.patch('/:id/approve', requireAuth, approveGovRequest);
router.patch('/:id/reject', requireAuth, rejectGovRequest);

export default router;

