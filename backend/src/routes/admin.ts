import { Router } from 'express';
import {
  getDashboard,
  getStatistics,
  getExceptions,
  handleException,
  getPerformanceReport
} from '../controllers/adminController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['admin', 'customer_service']));

router.get('/dashboard', getDashboard);
router.get('/statistics', getStatistics);
router.get('/exceptions', getExceptions);
router.get('/performance', getPerformanceReport);
router.post('/handle-exception', handleException);

export default router;
