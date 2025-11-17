import express from 'express';
import { signup, login, getMe, adminAuthorize, governmentAuthorize } from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/me', requireAuth, getMe);
router.post('/admin-authorize', requireAuth, adminAuthorize);
router.post('/government-authorize', requireAuth, governmentAuthorize);

export default router;

