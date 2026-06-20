import { Router } from 'express';
import { getDriverCredits, getDriverCreditByDriverId, getCreditRanking, getCreditModel, recalculateCredit } from '../controllers/driverCreditController';

const router = Router();

router.get('/ranking', getCreditRanking);
router.get('/model', getCreditModel);
router.get('/driver/:driverId', getDriverCreditByDriverId);
router.post('/:driverId/recalculate', recalculateCredit);
router.get('/', getDriverCredits);

export default router;
