import { Router } from 'express';
import { ServiceItemController } from '../controllers/ServiceItemController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, ServiceItemController.search);
router.get('/categories', authenticateToken, ServiceItemController.getCategories);
router.get('/:id', authenticateToken, ServiceItemController.getById);
router.get('/:id/scenario', authenticateToken, ServiceItemController.getScenarioGuide);
router.get('/:id/form-schema', authenticateToken, ServiceItemController.getFormSchema);
router.get('/:id/materials', authenticateToken, ServiceItemController.getMaterials);

export default router;
