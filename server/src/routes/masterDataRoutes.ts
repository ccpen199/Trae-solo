import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getProcessRoutes,
  getProcessRoute,
  getMaterials,
  getMaterial,
  getEquipment,
  getEquipmentById,
  getBoms,
  getBom,
  getOperationLogs,
  getProductionHistory,
} from '../controllers/masterDataController';

const router = Router();

router.use(authenticateToken);

router.get('/process-routes', getProcessRoutes);
router.get('/process-routes/:id', getProcessRoute);
router.get('/materials', getMaterials);
router.get('/materials/:id', getMaterial);
router.get('/equipment', getEquipment);
router.get('/equipment/:id', getEquipmentById);
router.get('/boms', getBoms);
router.get('/boms/:id', getBom);
router.get('/operation-logs', getOperationLogs);
router.get('/production-history', getProductionHistory);

export default router;
