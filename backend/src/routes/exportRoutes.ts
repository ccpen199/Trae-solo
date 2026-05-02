import { Router } from 'express';
import * as exportController from '../controllers/exportController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/accounts', authMiddleware, exportController.exportValidation, exportController.exportAccounts);
router.get('/orders', authMiddleware, exportController.exportValidation, exportController.exportOrders);
router.get('/exceptions', authMiddleware, exportController.exportValidation, exportController.exportExceptions);

export default router;
