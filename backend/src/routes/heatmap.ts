import { Router, Response } from 'express';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.ts';
import { calculateHeatmap, getHeatmap, getGapPredictions } from '../services/heatmap.ts';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const data = getHeatmap();

  res.json({
    code: 0,
    data,
    message: 'Success',
  });
});

router.post('/refresh', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  const data = calculateHeatmap();

  res.json({
    code: 0,
    data,
    message: 'Heatmap recalculated successfully',
  });
});

router.get('/prediction', authMiddleware, (req: AuthRequest, res: Response) => {
  const predictions = getGapPredictions();

  res.json({
    code: 0,
    data: predictions,
    message: 'Success',
  });
});

export default router;
