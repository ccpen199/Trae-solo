import db from '../database/index.js';
import { isPointInFence, isPointInPolygon } from '../utils/geolocation.js';
import dayjs from 'dayjs';
import type {
  AttendanceRecord,
  AttendanceQueryParams,
  AttendanceStats,
  CheckInRequest,
  PageResponse,
  CheckInType,
  AttendanceStatus,
} from '../../shared/types.js';

function mapAttendanceRow(row: any): AttendanceRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    schoolId: row.school_id,
    checkInTime: row.check_in_time,
    checkInType: row.check_in_type as CheckInType,
    locationLat: row.location_lat,
    locationLng: row.location_lng,
    locationAccuracy: row.location_accuracy,
    isInFence: row.is_in_fence === 1,
    faceMatchScore: row.face_match_score,
    status: row.status as AttendanceStatus,
    remark: row.remark,
    className: row.class_name,
  };
}

function mapStatsRow(row: any): AttendanceStats {
  return {
    date: row.date,
    schoolId: row.school_id,
    schoolName: row.school_name,
    totalStudents: row.total_students,
    checkedIn: row.checked_in,
    absent: row.absent,
    late: row.late,
    exception: row.exception,
    attendanceRate: row.attendance_rate,
  };
}

export function isInFence(lat: number, lng: number, schoolId: number): boolean {
  const fence = db.prepare(`
    SELECT center_lat, center_lng, radius, polygon
    FROM geo_fences
    WHERE school_id = ?
  `).get(schoolId) as {
    center_lat: number;
    center_lng: number;
    radius: number;
    polygon?: string;
  } | undefined;

  if (!fence) {
    return false;
  }

  if (fence.polygon) {
    try {
      const polygon = JSON.parse(fence.polygon) as Array<{ lat: number; lng: number }>;
      if (polygon.length >= 3) {
        return isPointInPolygon(lat, lng, polygon);
      }
    } catch (err) {
      console.error('Failed to parse polygon:', err);
    }
  }

  return isPointInFence(lat, lng, fence.center_lat, fence.center_lng, fence.radius);
}

function createAlert(
  schoolId: number,
  type: 'absent' | 'abnormal_leave',
  level: 'low' | 'medium' | 'high',
  studentId: number,
  studentName: string,
  title: string,
  description: string
): void {
  db.prepare(`
    INSERT INTO alert_records (
      school_id, type, level, student_id, student_name, title, description, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(schoolId, type, level, studentId, studentName, title, description);
}

function determineStatus(
  checkInTime: Date,
  inFence: boolean,
  faceMatchScore?: number
): { status: AttendanceStatus; remark?: string } {
  const hour = checkInTime.getHours();
  const minute = checkInTime.getMinutes();
  const checkInMinutes = hour * 60 + minute;

  const lateThreshold = 8 * 60 + 30;

  if (!inFence) {
    return { status: 'exception', remark: '不在考勤围栏范围内' };
  }

  if (faceMatchScore !== undefined && faceMatchScore < 0.8) {
    return { status: 'exception', remark: '人脸匹配分数过低' };
  }

  if (checkInMinutes > lateThreshold) {
    return { status: 'late', remark: `迟到${Math.floor((checkInMinutes - lateThreshold) / 60)}小时${(checkInMinutes - lateThreshold) % 60}分钟` };
  }

  return { status: 'normal' };
}

export function checkIn(
  data: CheckInRequest,
  userSchoolId?: number
): AttendanceRecord {
  const student = db.prepare(`
    SELECT id, name, school_id, class, status
    FROM students
    WHERE id = ?
  `).get(data.studentId) as {
    id: number;
    name: string;
    school_id: number;
    class: string;
    status: string;
  } | undefined;

  if (!student) {
    throw new Error('学生不存在');
  }

  if (student.status !== 'active') {
    throw new Error('学生状态异常，无法打卡');
  }

  if (userSchoolId !== undefined && student.school_id !== userSchoolId) {
    throw new Error('无权限操作该学校学生');
  }

  const inFence = isInFence(data.locationLat, data.locationLng, student.school_id);

  const checkInTime = new Date();
  const { status, remark } = determineStatus(
    checkInTime,
    inFence,
    data.faceMatchScore
  );

  const todayStart = dayjs(checkInTime).startOf('day').format('YYYY-MM-DD HH:mm:ss');
  const todayEnd = dayjs(checkInTime).endOf('day').format('YYYY-MM-DD HH:mm:ss');

  const existingCheckIn = db.prepare(`
    SELECT id FROM attendance_records
    WHERE student_id = ? AND check_in_time >= ? AND check_in_time <= ?
  `).get(data.studentId, todayStart, todayEnd);

  if (existingCheckIn) {
    throw new Error('今日已打卡');
  }

  const checkInType: CheckInType = data.faceImage ? 'face' : 'manual';

  const result = db.prepare(`
    INSERT INTO attendance_records (
      student_id, student_name, school_id, check_in_time, check_in_type,
      location_lat, location_lng, location_accuracy, is_in_fence,
      face_match_score, status, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    student.id,
    student.name,
    student.school_id,
    checkInTime.toISOString(),
    checkInType,
    data.locationLat,
    data.locationLng,
    data.locationAccuracy,
    inFence ? 1 : 0,
    data.faceMatchScore || null,
    status,
    remark || null
  );

  if (status === 'absent') {
    createAlert(
      student.school_id,
      'absent',
      'medium',
      student.id,
      student.name,
      '学生缺勤预警',
      `${student.name}今日未按时打卡，状态为缺勤`
    );
  } else if (status === 'exception') {
    createAlert(
      student.school_id,
      'abnormal_leave',
      'high',
      student.id,
      student.name,
      '考勤异常预警',
      `${student.name}打卡异常：${remark || '未知原因'}`
    );
  }

  const row = db.prepare(`
    SELECT ar.*, s.class as class_name
    FROM attendance_records ar
    LEFT JOIN students s ON ar.student_id = s.id
    WHERE ar.id = ?
  `).get(result.lastInsertRowid) as any;

  return mapAttendanceRow(row);
}

export function getList(
  params: AttendanceQueryParams,
  schoolIds: number[]
): PageResponse<AttendanceRecord> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const whereClauses: string[] = [];
  const queryParams: any[] = [];

  if (schoolIds.length > 0) {
    const placeholders = schoolIds.map(() => '?').join(',');
    whereClauses.push(`ar.school_id IN (${placeholders})`);
    queryParams.push(...schoolIds);
  }

  if (params.keyword) {
    whereClauses.push('(ar.student_name LIKE ?)');
    queryParams.push(`%${params.keyword}%`);
  }

  if (params.schoolId) {
    whereClauses.push('ar.school_id = ?');
    queryParams.push(params.schoolId);
  }

  if (params.studentId) {
    whereClauses.push('ar.student_id = ?');
    queryParams.push(params.studentId);
  }

  if (params.startDate) {
    whereClauses.push('ar.check_in_time >= ?');
    queryParams.push(params.startDate);
  }

  if (params.endDate) {
    whereClauses.push('ar.check_in_time <= ?');
    queryParams.push(params.endDate);
  }

  if (params.status) {
    whereClauses.push('ar.status = ?');
    queryParams.push(params.status);
  }

  if (params.className) {
    whereClauses.push('s.class = ?');
    queryParams.push(params.className);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) as total
    FROM attendance_records ar
    LEFT JOIN students s ON ar.student_id = s.id
    ${whereSql}
  `;

  const countRow = db.prepare(countSql).get(...queryParams) as { total: number };
  const total = countRow.total;

  const listSql = `
    SELECT ar.*, s.class as class_name
    FROM attendance_records ar
    LEFT JOIN students s ON ar.student_id = s.id
    ${whereSql}
    ORDER BY ar.check_in_time DESC
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(listSql).all(...queryParams, pageSize, offset) as any[];
  const list = rows.map(mapAttendanceRow);

  return {
    list,
    total,
    page,
    pageSize,
  };
}

export function getStatistics(
  params: { startDate?: string; endDate?: string; schoolId?: number },
  schoolIds: number[]
): AttendanceStats[] {
  const whereClauses: string[] = [];
  const queryParams: any[] = [];

  if (schoolIds.length > 0) {
    const placeholders = schoolIds.map(() => '?').join(',');
    whereClauses.push(`s.school_id IN (${placeholders})`);
    queryParams.push(...schoolIds);
  }

  if (params.schoolId) {
    whereClauses.push('s.school_id = ?');
    queryParams.push(params.schoolId);
  }

  if (params.startDate) {
    whereClauses.push('DATE(ar.check_in_time) >= DATE(?)');
    queryParams.push(params.startDate);
  }

  if (params.endDate) {
    whereClauses.push('DATE(ar.check_in_time) <= DATE(?)');
    queryParams.push(params.endDate);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT
      DATE(ar.check_in_time) as date,
      s.school_id,
      sc.name as school_name,
      COUNT(DISTINCT s.id) as total_students,
      COUNT(DISTINCT CASE WHEN ar.id IS NOT NULL THEN s.id END) as checked_in,
      COUNT(DISTINCT CASE WHEN ar.status = 'absent' THEN s.id END) as absent,
      COUNT(DISTINCT CASE WHEN ar.status = 'late' THEN s.id END) as late,
      COUNT(DISTINCT CASE WHEN ar.status = 'exception' THEN s.id END) as exception,
      ROUND(
        COUNT(DISTINCT CASE WHEN ar.id IS NOT NULL AND ar.status IN ('normal', 'late') THEN s.id END) * 100.0 /
        NULLIF(COUNT(DISTINCT s.id), 0),
        2
      ) as attendance_rate
    FROM students s
    LEFT JOIN attendance_records ar ON s.id = ar.student_id
      AND DATE(ar.check_in_time) = DATE(ar.check_in_time)
    LEFT JOIN schools sc ON s.school_id = sc.id
    ${whereSql}
    AND s.status = 'active'
    GROUP BY DATE(ar.check_in_time), s.school_id, sc.name
    ORDER BY date DESC, s.school_id
  `;

  const rows = db.prepare(sql).all(...queryParams) as any[];
  return rows.map(mapStatsRow);
}
