import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import {
  submitReport,
  submitReportValidation,
  getRealtimeStatus,
  getProcessDashboard,
  getWorkOrderYield,
  getWorkOrdersYield,
  getDailyYield,
  getQualityInspectionYield,
  getOEE,
  getReports,
} from '../controllers/reportController';
import { UserRole } from '../config';

const router = Router();

router.use(authenticateToken);

router.get('/realtime-status', getRealtimeStatus);
router.get('/process/:processId/dashboard', getProcessDashboard);
router.get('/yield/work-order/:workOrderId', getWorkOrderYield);
router.get('/yield/work-orders', getWorkOrdersYield);
router.get('/yield/daily', getDailyYield);
router.get('/yield/quality', getQualityInspectionYield);
router.get('/oee/:workOrderId', getOEE);
router.get('/', getReports);
router.post('/', requireRoles(UserRole.OPERATOR, UserRole.TEAM_LEADER), submitReportValidation, submitReport);

export default router;
