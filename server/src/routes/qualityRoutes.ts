import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import {
  createInspection,
  createInspectionValidation,
  updateInspectionResult,
  updateInspectionResultValidation,
  getInspections,
  getInspection,
} from '../controllers/qualityController';
import { UserRole } from '../config';

const router = Router();

router.use(authenticateToken);

router.get('/', getInspections);
router.get('/:id', getInspection);
router.post('/', requireRoles(UserRole.QUALITY_INSPECTOR), createInspectionValidation, createInspection);
router.put('/:id/result', requireRoles(UserRole.QUALITY_INSPECTOR), updateInspectionResultValidation, updateInspectionResult);

export default router;
