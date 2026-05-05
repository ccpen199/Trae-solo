import { Router } from 'express';
import {
  getAttendances,
  getAttendanceById,
  getAttendanceByMonth,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  batchCreateAttendance,
} from '../controllers/attendanceController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getAttendances);
router.get('/batch', authenticateToken, requireAdmin, batchCreateAttendance);
router.get('/:id', authenticateToken, getAttendanceById);
router.get('/employee/:employeeId/:year/:month', authenticateToken, getAttendanceByMonth);
router.post('/', authenticateToken, requireAdmin, createAttendance);
router.post('/batch', authenticateToken, requireAdmin, batchCreateAttendance);
router.put('/:id', authenticateToken, requireAdmin, updateAttendance);
router.delete('/:id', authenticateToken, requireAdmin, deleteAttendance);

export default router;
