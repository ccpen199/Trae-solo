import { Router } from 'express';
import { MerchantController } from '../controllers/MerchantController.js';
import { authMiddleware, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();
const merchantController = new MerchantController();

router.get('/approved', optionalAuth, merchantController.approved.bind(merchantController));
router.get('/categories', optionalAuth, merchantController.categories.bind(merchantController));
router.get('/search', optionalAuth, merchantController.search.bind(merchantController));
router.get('/', authMiddleware, merchantController.list.bind(merchantController));
router.post('/', authMiddleware, merchantController.create.bind(merchantController));
router.get('/:id', optionalAuth, merchantController.get.bind(merchantController));
router.put('/:id', authMiddleware, merchantController.update.bind(merchantController));
router.delete('/:id', authMiddleware, requireRole('admin'), merchantController.delete.bind(merchantController));
router.post('/:id/approve', authMiddleware, requireRole('admin'), merchantController.approve.bind(merchantController));
router.post('/:id/reject', authMiddleware, requireRole('admin'), merchantController.reject.bind(merchantController));

export default router;
