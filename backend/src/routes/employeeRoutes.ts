import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} from '../controllers/employeeController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticateToken, getEmployeeStats);
router.get('/', authenticateToken, getEmployees);
router.get('/:id', authenticateToken, getEmployeeById);
router.post('/', authenticateToken, requireAdmin, createEmployee);
router.put('/:id', authenticateToken, requireAdmin, updateEmployee);
router.delete('/:id', authenticateToken, requireAdmin, deleteEmployee);

export default router;
