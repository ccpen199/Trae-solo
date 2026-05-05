import { Router } from 'express';
import {
  getSalaries,
  getSalaryById,
  createSalary,
  updateSalary,
  deleteSalary,
  batchCalculateSalary,
  getSalaryReport,
} from '../controllers/salaryController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/report', authenticateToken, getSalaryReport);
router.get('/', authenticateToken, getSalaries);
router.get('/:id', authenticateToken, getSalaryById);
router.post('/', authenticateToken, requireAdmin, createSalary);
router.post('/batch', authenticateToken, requireAdmin, batchCalculateSalary);
router.put('/:id', authenticateToken, requireAdmin, updateSalary);
router.delete('/:id', authenticateToken, requireAdmin, deleteSalary);

export default router;
