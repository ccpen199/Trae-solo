import express from 'express';
import { BuildingController } from '../controllers/BuildingController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, BuildingController.getAllBuildings);
router.get('/graph', authMiddleware, BuildingController.getBuildingGraph);
router.get('/:id', authMiddleware, BuildingController.getBuildingById);
router.get('/:id/units', authMiddleware, BuildingController.getUnitsByBuilding);
router.get('/:id/residents', authMiddleware, BuildingController.getResidentsByBuilding);
router.post('/', authMiddleware, requireRole('admin', 'property'), BuildingController.createBuilding);
router.put('/:id', authMiddleware, requireRole('admin', 'property'), BuildingController.updateBuilding);
router.delete('/:id', authMiddleware, requireRole('admin'), BuildingController.deleteBuilding);

export default router;
