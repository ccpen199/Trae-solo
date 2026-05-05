import { Router } from 'express';
import authRoutes from './auth.routes';
import newsRoutes from './news.routes';
import productRoutes from './product.routes';
import dealerRoutes from './dealer.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/news', newsRoutes);
router.use('/products', productRoutes);
router.use('/dealer', dealerRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
