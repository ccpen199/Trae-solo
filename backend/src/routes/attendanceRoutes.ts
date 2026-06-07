import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getProjectAttendance
} from '../controllers/attendanceController';

const router = Router();

router.post('/attendance/checkin', authenticateToken, requireRole('worker'), auditLog('check_in', 'attendance_records'), checkIn);
router.post('/attendance/checkout', authenticateToken, requireRole('worker'), auditLog('check_out', 'attendance_records'), checkOut);
router.get('/attendance/my', authenticateToken, requireRole('worker'), getMyAttendance);
router.get('/attendance/project', authenticateToken, getProjectAttendance);

export default router;
