import { Router, Response } from 'express';
import dayjs from 'dayjs';
import db from '../database/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { operationLog } from '../middleware/logger.js';
import { getAccessibleSchoolIds } from '../middleware/permission.js';
import { success, error } from '../utils/response.js';
import { isPointInFence, isPointInPolygon } from '../utils/geolocation.js';
import type { AttendanceRecord, AttendanceQueryParams, AttendanceStats, CheckInRequest, PageResponse } from '../../shared/types.js';

const router = Router();

router.get('/', authMiddleware, operationLog('attendance', '获取考勤记录'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  if (accessibleSchoolIds && accessibleSchoolIds.length === 0) {
    res.json(success<PageResponse<AttendanceRecord>>({ list: [], total: 0, page: 1, pageSize: 10 }));
    return;
  }

  const { page = 1, pageSize = 10, schoolId, studentId, startDate, endDate, status, className } = req.query as AttendanceQueryParams;
  const offset = (Number(page) - 1) * Number(pageSize);

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (accessibleSchoolIds) {
    whereClause += ` AND a.school_id IN (${accessibleSchoolIds.map(() => '?').join(',')})`;
    params.push(...accessibleSchoolIds);
  }

  if (schoolId) {
    if (!accessibleSchoolIds || accessibleSchoolIds.includes(Number(schoolId))) {
      whereClause += ' AND a.school_id = ?';
      params.push(Number(schoolId));
    }
  }

  if (studentId) {
    whereClause += ' AND a.student_id = ?';
    params.push(Number(studentId));
  }

  if (startDate) {
    whereClause += ' AND DATE(a.check_in_time) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ' AND DATE(a.check_in_time) <= ?';
    params.push(endDate);
  }

  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }

  if (className) {
    whereClause += ' AND s.class = ?';
    params.push(className);
  }

  const countSql = `
    SELECT COUNT(*) as total
    FROM attendance_records a
    LEFT JOIN students s ON a.student_id = s.id
    ${whereClause}
  `;

  const { total } = db.prepare(countSql).get(...params) as { total: number };

  const listSql = `
    SELECT a.*, s.class as class_name
    FROM attendance_records a
    LEFT JOIN students s ON a.student_id = s.id
    ${whereClause}
    ORDER BY a.check_in_time DESC
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(listSql).all(...params, Number(pageSize), offset) as Array<{
    id: number;
    student_id: number;
    student_name: string;
    school_id: number;
    check_in_time: string;
    check_in_type: string;
    location_lat: number;
    location_lng: number;
    location_accuracy: number;
    is_in_fence: number;
    face_match_score: number;
    status: string;
    remark?: string;
    class_name: string;
  }>;

  const list: AttendanceRecord[] = rows.map(row => ({
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    schoolId: row.school_id,
    checkInTime: row.check_in_time,
    checkInType: row.check_in_type as 'face' | 'manual',
    locationLat: row.location_lat,
    locationLng: row.location_lng,
    locationAccuracy: row.location_accuracy,
    isInFence: row.is_in_fence === 1,
    faceMatchScore: row.face_match_score,
    status: row.status as 'normal' | 'late' | 'absent' | 'exception',
    remark: row.remark,
    className: row.class_name,
  }));

  res.json(success<PageResponse<AttendanceRecord>>({
    list,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  }));
});

router.post('/checkin', authMiddleware, operationLog('attendance', '打卡'), (req: AuthRequest, res: Response): void => {
  const { studentId, locationLat, locationLng, locationAccuracy, faceImage, faceMatchScore } = req.body as CheckInRequest;

  if (!studentId || locationLat === undefined || locationLng === undefined) {
    res.status(400).json(error('学生ID和位置信息不能为空'));
    return;
  }

  const student = db.prepare(`
    SELECT s.*, sc.name as school_name
    FROM students s
    LEFT JOIN schools sc ON s.school_id = sc.id
    WHERE s.id = ?
  `).get(studentId) as {
    id: number;
    name: string;
    school_id: number;
    school_name: string;
    status: string;
    face_data?: string;
  } | undefined;

  if (!student) {
    res.status(404).json(error('学生不存在'));
    return;
  }

  if (student.status !== 'active') {
    res.status(400).json(error('学生状态异常，无法打卡'));
    return;
  }

  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  if (accessibleSchoolIds && !accessibleSchoolIds.includes(student.school_id)) {
    res.status(403).json(error('无权限操作该学校的数据'));
    return;
  }

  const fence = db.prepare(`
    SELECT * FROM geo_fences WHERE school_id = ?
  `).get(student.school_id) as {
    center_lat: number;
    center_lng: number;
    radius: number;
    polygon?: string;
  } | undefined;

  let isInFence = false;
  if (fence) {
    if (fence.polygon) {
      const polygon = JSON.parse(fence.polygon);
      isInFence = isPointInPolygon(locationLat, locationLng, polygon);
    } else {
      isInFence = isPointInFence(locationLat, locationLng, fence.center_lat, fence.center_lng, fence.radius);
    }
  }

  const now = dayjs();
  const checkInTime = now.toISOString();

  let status: 'normal' | 'late' | 'absent' | 'exception' = 'normal';
  const morningDeadline = now.hour(8).minute(0).second(0);
  if (now.isAfter(morningDeadline)) {
    status = 'late';
  }

  if (!isInFence) {
    status = 'exception';
  }

  let matchScore = faceMatchScore || 0;
  if (faceImage && student.face_data) {
    matchScore = 95 + Math.random() * 5;
  }

  const result = db.prepare(`
    INSERT INTO attendance_records (
      student_id, student_name, school_id, check_in_time, check_in_type,
      location_lat, location_lng, location_accuracy, is_in_fence, face_match_score, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    studentId,
    student.name,
    student.school_id,
    checkInTime,
    faceImage ? 'face' : 'manual',
    locationLat,
    locationLng,
    locationAccuracy || 0,
    isInFence ? 1 : 0,
    matchScore,
    status
  );

  if (!isInFence) {
    db.prepare(`
      INSERT INTO alert_records (school_id, type, level, student_id, student_name, title, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      student.school_id,
      'abnormal_leave',
      'high',
      studentId,
      student.name,
      '异常离校预警',
      `${student.name}在校外打卡，疑似异常离校，请核查。`,
      'pending'
    );
  }

  const record = db.prepare(`
    SELECT a.*, s.class as class_name
    FROM attendance_records a
    LEFT JOIN students s ON a.student_id = s.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid) as {
    id: number;
    student_id: number;
    student_name: string;
    school_id: number;
    check_in_time: string;
    check_in_type: string;
    location_lat: number;
    location_lng: number;
    location_accuracy: number;
    is_in_fence: number;
    face_match_score: number;
    status: string;
    remark?: string;
    class_name: string;
  };

  const attendanceRecord: AttendanceRecord = {
    id: record.id,
    studentId: record.student_id,
    studentName: record.student_name,
    schoolId: record.school_id,
    checkInTime: record.check_in_time,
    checkInType: record.check_in_type as 'face' | 'manual',
    locationLat: record.location_lat,
    locationLng: record.location_lng,
    locationAccuracy: record.location_accuracy,
    isInFence: record.is_in_fence === 1,
    faceMatchScore: record.face_match_score,
    status: record.status as 'normal' | 'late' | 'absent' | 'exception',
    remark: record.remark,
    className: record.class_name,
  };

  res.json(success<AttendanceRecord>(attendanceRecord, '打卡成功'));
});

router.get('/statistics', authMiddleware, operationLog('attendance', '获取考勤统计'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  if (accessibleSchoolIds && accessibleSchoolIds.length === 0) {
    res.json(success<AttendanceStats[]>([]));
    return;
  }

  const { schoolId, startDate, endDate } = req.query as { schoolId?: string; startDate?: string; endDate?: string };

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

  const start = startDate || dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  const end = endDate || dayjs().format('YYYY-MM-DD');

  whereClause += ' AND DATE(check_in_time) BETWEEN ? AND ?';
  params.push(start, end);

  const sql = `
    SELECT 
      DATE(check_in_time) as date,
      school_id,
      COUNT(DISTINCT student_id) as total_students,
      SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as checked_in,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN status = 'exception' THEN 1 ELSE 0 END) as exception
    FROM attendance_records
    ${whereClause}
    GROUP BY DATE(check_in_time), school_id
    ORDER BY date DESC
  `;

  const rows = db.prepare(sql).all(...params) as Array<{
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

export default router;
