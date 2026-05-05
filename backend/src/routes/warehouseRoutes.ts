import { Router } from 'express';
import {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
} from '../controllers/warehouseController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getWarehouses);
router.post('/', createWarehouse);
router.get('/:id', getWarehouseById);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

export default router;
