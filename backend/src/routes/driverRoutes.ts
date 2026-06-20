import { Router } from 'express';
import { getDrivers, getDriverById, createDriver } from '../controllers/driverController';

const router = Router();

router.get('/', getDrivers);
router.get('/:id', getDriverById);
router.post('/', createDriver);

export default router;
