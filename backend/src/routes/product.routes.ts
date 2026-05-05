import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/categories', productController.getCategories);
router.get('/', productController.getProductList);
router.get('/:id', productController.getProductDetail);

router.post(
  '/',
  authenticateToken,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  productController.createProduct
);

router.get('/cart', authenticateToken, productController.getCart);
router.post('/cart', authenticateToken, productController.addToCart);
router.put('/cart/:itemId', authenticateToken, productController.updateCartItem);
router.delete('/cart/:itemId', authenticateToken, productController.removeFromCart);

export default router;
