import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentTree,
} from '../controllers/departmentController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/tree', authenticateToken, getDepartmentTree);
router.get('/', authenticateToken, getDepartments);
router.get('/:id', authenticateToken, getDepartmentById);
router.post('/', authenticateToken, requireAdmin, createDepartment);
router.put('/:id', authenticateToken, requireAdmin, updateDepartment);
router.delete('/:id', authenticateToken, requireAdmin, deleteDepartment);

export default router;
