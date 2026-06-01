import { Router } from 'express';
import { ReportController } from '../controllers/ReportController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const reportController = new ReportController();

router.get('/summary', authMiddleware(['admin', 'operator', 'finance']), (req, res) => reportController.getSummary(req, res));
router.get('/dashboard', authMiddleware(['admin', 'operator', 'finance']), (req, res) => reportController.getDashboard(req, res));
router.get('/trend', authMiddleware(['admin', 'operator', 'finance']), (req, res) => reportController.getTrendData(req, res));
router.get('/prize-distribution', authMiddleware(['admin', 'operator', 'finance']), (req, res) => reportController.getPrizeDistribution(req, res));
router.get('/channel-distribution', authMiddleware(['admin', 'operator', 'finance']), (req, res) => reportController.getChannelDistribution(req, res));
router.get('/export', authMiddleware(['admin', 'finance']), (req, res) => reportController.exportReport(req, res));

export default router;
