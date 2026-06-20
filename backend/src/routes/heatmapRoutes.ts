import { Router } from 'express';
import { getHeatmapData, getAreaDetails } from '../controllers/heatmapController';

const router = Router();

router.get('/', getHeatmapData);
router.get('/areas', getAreaDetails);

export default router;
