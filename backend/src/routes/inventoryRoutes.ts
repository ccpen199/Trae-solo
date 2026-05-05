import { Router } from 'express';
import {
  getInventory,
  createStockIn,
  getStockIns,
  getStockInById,
  approveStockIn,
  createStockOut,
  getStockOuts,
  getStockOutById,
  approveStockOut,
} from '../controllers/inventoryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/stock', getInventory);

router.get('/stock-in', getStockIns);
router.post('/stock-in', createStockIn);
router.get('/stock-in/:id', getStockInById);
router.post('/stock-in/:id/approve', approveStockIn);

router.get('/stock-out', getStockOuts);
router.post('/stock-out', createStockOut);
router.get('/stock-out/:id', getStockOutById);
router.post('/stock-out/:id/approve', approveStockOut);

export default router;
