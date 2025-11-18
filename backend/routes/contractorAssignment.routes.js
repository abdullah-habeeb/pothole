import express from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireGovernmentAccess } from '../middleware/government.js';
import {
  createContractorAssignment,
  getContractorAssignments,
  updateContractorAssignmentStatus,
} from '../controllers/contractorAssignment.controller.js';

const router = express.Router();

router.get('/', requireAuth, getContractorAssignments);
router.post('/', requireAuth, requireGovernmentAccess, createContractorAssignment);
router.patch('/:id/status', requireAuth, requireGovernmentAccess, updateContractorAssignmentStatus);

export default router;

