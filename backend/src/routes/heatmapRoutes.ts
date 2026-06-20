import { Router } from 'express';
import { getHeatmapData } from '../controllers/heatmapController';

const router = Router();

router.get('/', getHeatmapData);

export default router;
