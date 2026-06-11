import { Router, Response } from 'express';
import dayjs from 'dayjs';
import db from '../database/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { operationLog } from '../middleware/logger.js';
import { getAccessibleSchoolIds } from '../middleware/permission.js';
import { success, error } from '../utils/response.js';
import type { AttendanceStats, FundingStats } from '../../shared/types.js';

const router = Router();

router.get('/attendance', authMiddleware, operationLog('statistics', '考勤统计报表'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  if (accessibleSchoolIds && accessibleSchoolIds.length === 0) {
    res.json(success<AttendanceStats[]>([]));
    return;
  }

  const { schoolId, startDate, endDate, groupBy = 'day' } = req.query as {
    schoolId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  };

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (accessibleSchoolIds) {
    whereClause += ` AND school_id IN (${accessibleSchoolIds.map(() => '?').join(',')})`;
    params.push(...accessibleSchoolIds);
  }

  if (schoolId) {
    if (!accessibleSchoolIds || accessibleSchoolIds.includes(Number(schoolId))) {
      whereClause += ' AND school_id = ?';
      params.push(Number(schoolId));
    }
  }

  const start = startDate || dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const end = endDate || dayjs().format('YYYY-MM-DD');

  whereClause += ' AND DATE(check_in_time) BETWEEN ? AND ?';
  params.push(start, end);

  let dateFormat = '%Y-%m-%d';
  if (groupBy === 'week') {
    dateFormat = '%Y-%W';
  } else if (groupBy === 'month') {
    dateFormat = '%Y-%m';
  }

  const sql = `
    SELECT 
      strftime(?, check_in_time) as date,
      school_id,
      COUNT(DISTINCT student_id) as total_students,
      SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as checked_in,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN status = 'exception' THEN 1 ELSE 0 END) as exception
    FROM attendance_records
    ${whereClause}
    GROUP BY strftime(?, check_in_time), school_id
    ORDER BY date DESC
  `;

  const rows = db.prepare(sql).all(dateFormat, ...params, dateFormat) as Array<{
    date: string;
    school_id: number;
    total_students: number;
    checked_in: number;
    absent: number;
    late: number;
    exception: number;
  }>;

  const schoolIds = [...new Set(rows.map(r => r.school_id))];
  const schoolNames: Record<number, string> = {};
  
  if (schoolIds.length > 0) {
    const schoolRows = db.prepare(`
      SELECT id, name FROM schools WHERE id IN (${schoolIds.map(() => '?').join(',')})
    `).all(...schoolIds) as Array<{ id: number; name: string }>;
    
    schoolRows.forEach(s => {
      schoolNames[s.id] = s.name;
    });
  }

  const stats: AttendanceStats[] = rows.map(row => ({
    date: row.date,
    schoolId: row.school_id,
    schoolName: schoolNames[row.school_id],
    totalStudents: row.total_students,
    checkedIn: row.checked_in,
    absent: row.absent,
    late: row.late,
    exception: row.exception,
    attendanceRate: row.total_students > 0 ? Math.round((row.checked_in / row.total_students) * 10000) / 100 : 0,
  }));

  res.json(success<AttendanceStats[]>(stats));
});

router.get('/funding', authMiddleware, operationLog('statistics', '资助统计报表'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  if (accessibleSchoolIds && accessibleSchoolIds.length === 0) {
    res.json(success<FundingStats[]>([]));
    return;
  }

  const { schoolId, batchNo } = req.query as { schoolId?: string; batchNo?: string };

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (accessibleSchoolIds) {
    whereClause += ` AND f.school_id IN (${accessibleSchoolIds.map(() => '?').join(',')})`;
    params.push(...accessibleSchoolIds);
  }

  if (schoolId) {
    if (!accessibleSchoolIds || accessibleSchoolIds.includes(Number(schoolId))) {
      whereClause += ' AND f.school_id = ?';
      params.push(Number(schoolId));
    }
  }

  if (batchNo) {
    whereClause += ' AND f.batch_no = ?';
    params.push(batchNo);
  }

  const sql = `
    SELECT 
      f.school_id,
      COUNT(DISTINCT s.id) as total_students,
      SUM(CASE WHEN s.is_funding_eligible = 1 THEN 1 ELSE 0 END) as eligible_students,
      SUM(f.amount) as total_amount,
      SUM(CASE WHEN f.status = 'distributed' OR f.status = 'received' THEN f.amount ELSE 0 END) as distributed_amount,
      SUM(CASE WHEN f.status = 'received' THEN f.amount ELSE 0 END) as received_amount,
      SUM(CASE WHEN f.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN f.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
      SUM(CASE WHEN f.status = 'distributed' THEN 1 ELSE 0 END) as distributed_count,
      SUM(CASE WHEN f.status = 'received' THEN 1 ELSE 0 END) as received_count
    FROM funding_records f
    LEFT JOIN students s ON f.student_id = s.id
    ${whereClause}
    GROUP BY f.school_id
  `;

  const rows = db.prepare(sql).all(...params) as Array<{
    school_id: number;
    total_students: number;
    eligible_students: number;
    total_amount: number;
    distributed_amount: number;
    received_amount: number;
    pending_count: number;
    approved_count: number;
    distributed_count: number;
    received_count: number;
  }>;

  const schoolIds = rows.map(r => r.school_id);
  const schoolNames: Record<number, string> = {};
  
  if (schoolIds.length > 0) {
    const schoolRows = db.prepare(`
      SELECT id, name FROM schools WHERE id IN (${schoolIds.map(() => '?').join(',')})
    `).all(...schoolIds) as Array<{ id: number; name: string }>;
    
    schoolRows.forEach(s => {
      schoolNames[s.id] = s.name;
    });
  }

  const stats: FundingStats[] = rows.map(row => ({
    schoolId: row.school_id,
    schoolName: schoolNames[row.school_id],
    totalStudents: row.total_students,
    eligibleStudents: row.eligible_students,
    totalAmount: row.total_amount,
    distributedAmount: row.distributed_amount,
    receivedAmount: row.received_amount,
    pendingCount: row.pending_count,
    approvedCount: row.approved_count,
    distributedCount: row.distributed_count,
    receivedCount: row.received_count,
  }));

  res.json(success<FundingStats[]>(stats));
});

export default router;
