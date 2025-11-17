import express from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import {
  createAssignment,
  getAssignments,
  updateAssignmentStatus,
} from '../controllers/assignment.controller.js';
import { requireGovernmentAccess } from '../middleware/government.js';

const router = express.Router();

router.get('/', requireAuth, getAssignments);
router.post('/', requireAuth, requireGovernmentAccess, createAssignment);
router.patch('/:id/status', requireAuth, requireGovernmentAccess, updateAssignmentStatus);

export default router;

