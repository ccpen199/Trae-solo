import { Router } from 'express';
import { getVisitorPasses, createVisitorPass, getAccessRecords, getAccessDevices, verifyPass } from '../controllers/access.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/passes', authMiddleware(['owner', 'tenant']), getVisitorPasses);
router.post('/passes', authMiddleware(['owner', 'tenant']), createVisitorPass);
router.get('/records', authMiddleware(), getAccessRecords);
router.get('/devices', authMiddleware(), getAccessDevices);
router.post('/verify', authMiddleware(), verifyPass);

export default router;
