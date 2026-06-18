import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard/stats', adminController.getDashboardStats);

router.get('/plans', adminController.getPlans);
router.get('/plans/:id', adminController.getPlanById);
router.post('/plans', adminController.createPlan);
router.put('/plans/:id/status', adminController.updatePlanStatus);
router.post('/tasks', adminController.createTask);

router.get('/reviewers', adminController.getReviewers);
router.put('/reviewers/:id/audit', adminController.auditReviewer);

router.get('/brands', adminController.getBrands);
router.put('/brands/:id/audit', adminController.auditBrand);

router.get('/reports', adminController.getReports);
router.get('/reports/:id', adminController.getReportById);
router.post('/reports/:id/audit', adminController.auditReport);
router.get('/reports/:reportId/logs', adminController.getAuditLogs);

router.get('/appeals', adminController.getAppeals);
router.get('/appeals/:id', adminController.getAppealById);
router.put('/appeals/:id/process', adminController.processAppeal);

router.get('/weights', adminController.getWeightConfigs);
router.put('/weights', adminController.updateWeightConfig);

router.post('/rankings/generate', adminController.generateRanking);

export default router;
