import { Router } from 'express';
import { brandController } from '../controllers/brandController.js';
import { requireAuth, requireBrand } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireBrand);

router.get('/info/:id?', brandController.getBrandInfo);
router.get('/reports/:id?', brandController.getBrandReports);
router.get('/reputation/:id?', brandController.getReputationData);
router.post('/appeals', brandController.submitAppeal);
router.get('/appeals', brandController.getAppeals);
router.get('/appeals/:id', brandController.getAppealById);

export default router;
