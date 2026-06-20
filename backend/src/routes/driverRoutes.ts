import { Router } from 'express';
import { getDrivers, getDriverById, createDriver, getAvailableDrivers } from '../controllers/driverController';

const router = Router();

router.get('/', getDrivers);
router.get('/available', getAvailableDrivers);
router.get('/:id', getDriverById);
router.post('/', createDriver);

export default router;
