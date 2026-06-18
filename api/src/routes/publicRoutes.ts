import { Router } from 'express';
import { publicController } from '../controllers/publicController.js';

const router = Router();

router.get('/rankings', publicController.getRankings);
router.get('/rankings/:id', publicController.getRankingById);
router.get('/reports', publicController.getReports);
router.get('/reports/:id', publicController.getReportById);
router.get('/targets', publicController.getTargets);
router.get('/targets/:id', publicController.getTargetById);
router.get('/categories', publicController.getCategories);
router.get('/indicators', publicController.getIndicators);
router.post('/compare', publicController.compareTargets);

export default router;
