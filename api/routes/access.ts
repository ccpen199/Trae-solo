import express from 'express';
import { AccessController } from '../controllers/AccessController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/logs', authMiddleware, requireRole('admin', 'property'), AccessController.getAccessLogs);
router.post('/logs', authMiddleware, AccessController.createAccessLog);
router.get('/stats', authMiddleware, requireRole('admin', 'property'), AccessController.getAccessStats);

export default router;
