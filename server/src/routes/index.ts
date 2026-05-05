import { Router } from 'express';
import userRoutes from './user.routes';
import unionRoutes from './union.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/unions', unionRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'OK',
    timestamp: new Date().toISOString(),
  });
});

export default router;
