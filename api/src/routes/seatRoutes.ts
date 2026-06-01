import { Router } from 'express';
import * as seatController from '../controllers/seatController.js';

const router = Router();

router.get('/:sessionId', seatController.getSessionSeats);
router.get('/:sessionId/recommend', seatController.getSeatRecommendation);
router.post('/:seatId/lock', seatController.lockSeat);
router.post('/:seatId/unlock', seatController.unlockSeat);

export default router;
