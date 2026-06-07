import { Router } from 'express';
import { MarketController } from '../controllers/MarketController.js';
import { authMiddleware, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();
const marketController = new MarketController();

router.get('/categories', optionalAuth, marketController.categories.bind(marketController));
router.get('/search', optionalAuth, marketController.search.bind(marketController));
router.get('/', optionalAuth, marketController.list.bind(marketController));
router.get('/admin', authMiddleware, requireRole('admin', 'merchant'), marketController.adminList.bind(marketController));
router.post('/', authMiddleware, requireRole('admin', 'merchant'), marketController.create.bind(marketController));
router.get('/:id', optionalAuth, marketController.get.bind(marketController));
router.put('/:id', authMiddleware, requireRole('admin', 'merchant'), marketController.update.bind(marketController));
router.delete('/:id', authMiddleware, requireRole('admin'), marketController.delete.bind(marketController));
router.post('/:id/stock', authMiddleware, requireRole('admin', 'merchant'), marketController.updateStock.bind(marketController));
router.post('/:id/on-sale', authMiddleware, requireRole('admin', 'merchant'), marketController.onSale.bind(marketController));
router.post('/:id/off-sale', authMiddleware, requireRole('admin', 'merchant'), marketController.offSale.bind(marketController));

export default router;
