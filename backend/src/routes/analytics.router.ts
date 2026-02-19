import express from 'express';
import { authMiddleware } from '../auth.js';
import { track, getAnalytics } from '../controller/analytics.controller.js';

const router = express.Router();

router.post('/track', authMiddleware, track);
router.get('/analytics', authMiddleware, getAnalytics);

export default router;
