import express from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { getAllUsers } from '../controllers/admin.controller.js';

const router = express.Router();

// Get all users (admin only)
router.get('/users', requireAuth, getAllUsers);

export default router;

