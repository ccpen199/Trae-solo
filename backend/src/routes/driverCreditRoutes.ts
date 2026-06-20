import { Router } from 'express';
import { getDriverCredits, getDriverCreditByDriverId, getCreditRanking } from '../controllers/driverCreditController';

const router = Router();

router.get('/', getDriverCredits);
router.get('/ranking', getCreditRanking);
router.get('/driver/:driverId', getDriverCreditByDriverId);

export default router;
