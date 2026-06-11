import { Router } from 'express';
import { getAlerts, getAlertDetail, handleAlert, createAlert, getAbnormalVisitors } from '../controllers/risk.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/alerts', authMiddleware(['property']), getAlerts);
router.get('/alerts/:id', authMiddleware(['property']), getAlertDetail);
router.post('/alerts/:id/handle', authMiddleware(['property']), handleAlert);
router.post('/alerts', authMiddleware(['property']), createAlert);
router.get('/abnormal-visitors', authMiddleware(['property']), getAbnormalVisitors);

export default router;
