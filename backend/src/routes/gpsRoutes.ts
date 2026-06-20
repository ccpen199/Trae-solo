import { Router } from 'express';
import { createTrack, getTracksByOrderId } from '../controllers/gpsController';

const router = Router();

router.post('/track', createTrack);
router.get('/track/:orderId', getTracksByOrderId);

export default router;
