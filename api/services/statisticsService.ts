import db from '../database/index.js';
import type { AttendanceStats, FundingStats, AttendanceQueryParams, FundingQueryParams } from '@shared/types';

interface AttendanceStatsParams extends AttendanceQueryParams {
  dimension?: 'day' | 'week' | 'month';
}

export const statisticsService = {
  getAttendanceStats(params: AttendanceStatsParams, schoolIds: number[]): AttendanceStats[] {
    const whereConditions: string[] = [];
    const queryParams: (string | number | boolean)[] = [];

    if (schoolIds.length > 0) {
      whereConditions.push(`ar.school_id IN (${schoolIds.map(() => '?').join(', ')})`);
      queryParams.push(...schoolIds);
    }

    if (params.schoolId) {
      whereConditions.push('ar.school_id = ?');
      queryParams.push(params.schoolId);
    }

    if (params.startDate) {
      whereConditions.push('DATE(ar.check_in_time) >= ?');
      queryParams.push(params.startDate);
    }

    if (params.endDate) {
      whereConditions.push('DATE(ar.check_in_time) <= ?');
      queryParams.push(params.endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const dimension = params.dimension || 'day';
    let dateFormat: string;
    let groupBy: string;

    switch (dimension) {
      case 'week':
        dateFormat = "strftime('%Y-W%W', ar.check_in_time)";
        groupBy = dateFormat;
        break;
      case 'month':
        dateFormat = "strftime('%Y-%m', ar.check_in_time)";
        groupBy = dateFormat;
        break;
      case 'day':
      default:
        dateFormat = "DATE(ar.check_in_time)";
        groupBy = dateFormat;
    }

    const sql = `
      SELECT 
        ${dateFormat} as date,
        ar.school_id,
        s.name as school_name,
        COUNT(DISTINCT ar.student_id) as total_students,
        SUM(CASE WHEN ar.status = 'normal' THEN 1 ELSE 0 END) as checked_in,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN ar.status = 'exception' THEN 1 ELSE 0 END) as exception,
        ROUND(
          SUM(CASE WHEN ar.status IN ('normal', 'late') THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(COUNT(DISTINCT ar.student_id), 0), 
          2
        ) as attendance_rate
      FROM attendance_records ar
      LEFT JOIN schools s ON ar.school_id = s.id
      ${whereClause}
      GROUP BY ${groupBy}, ar.school_id
      ORDER BY date DESC
    `;

    const results = db.prepare(sql).all(...queryParams) as any[];

    return results.map(item => ({
      date: item.date,
      schoolId: item.school_id,
      schoolName: item.school_name,
      totalStudents: item.total_students || 0,
      checkedIn: item.checked_in || 0,
      absent: item.absent || 0,
      late: item.late || 0,
      exception: item.exception || 0,
      attendanceRate: item.attendance_rate || 0,
    }));
  },

  getFundingStats(params: FundingQueryParams, schoolIds: number[]): FundingStats[] {
    const whereConditions: string[] = [];
    const queryParams: (string | number | boolean)[] = [];

    if (schoolIds.length > 0) {
      whereConditions.push(`fr.school_id IN (${schoolIds.map(() => '?').join(', ')})`);
      queryParams.push(...schoolIds);
    }

    if (params.schoolId) {
      whereConditions.push('fr.school_id = ?');
      queryParams.push(params.schoolId);
    }

    if (params.batchNo) {
      whereConditions.push('fr.batch_no = ?');
      queryParams.push(params.batchNo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        fr.school_id,
        s.name as school_name,
        COUNT(DISTINCT st.id) as total_students,
        COUNT(DISTINCT CASE WHEN st.is_funding_eligible = 1 THEN st.id END) as eligible_students,
        COALESCE(SUM(fr.amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN fr.status IN ('distributed', 'received') THEN fr.amount ELSE 0 END), 0) as distributed_amount,
        COALESCE(SUM(CASE WHEN fr.status = 'received' THEN fr.amount ELSE 0 END), 0) as received_amount,
        SUM(CASE WHEN fr.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN fr.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN fr.status = 'distributed' THEN 1 ELSE 0 END) as distributed_count,
        SUM(CASE WHEN fr.status = 'received' THEN 1 ELSE 0 END) as received_count
      FROM schools s
      LEFT JOIN students st ON s.id = st.school_id AND st.status = 'active'
      LEFT JOIN funding_records fr ON s.id = fr.school_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.id
    `;

    const results = db.prepare(sql).all(...queryParams) as any[];

    return results.map(item => ({
      schoolId: item.school_id,
      schoolName: item.school_name,
      totalStudents: item.total_students || 0,
      eligibleStudents: item.eligible_students || 0,
      totalAmount: item.total_amount || 0,
      distributedAmount: item.distributed_amount || 0,
      receivedAmount: item.received_amount || 0,
      pendingCount: item.pending_count || 0,
      approvedCount: item.approved_count || 0,
      distributedCount: item.distributed_count || 0,
      receivedCount: item.received_count || 0,
    }));
  },

  getOverview(schoolIds: number[]): {
    totalStudents: number;
    activeStudents: number;
    todayAttendanceRate: number;
    totalFundingAmount: number;
    pendingAlerts: number;
    todayCheckIns: number;
    schools: Array<{
      id: number;
      name: string;
      studentCount: number;
      attendanceRate: number;
    }>;
  } {
    const schoolIdClause = schoolIds.length > 0
      ? `WHERE id IN (${schoolIds.map(() => '?').join(', ')})`
      : '';
    const schoolIdParams = [...schoolIds];

    const schoolsSql = `
      SELECT id, name FROM schools ${schoolIdClause} ORDER BY id
    `;
    const schools = db.prepare(schoolsSql).all(...schoolIdParams) as Array<{ id: number; name: string }>;

    const studentCountSql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM students
      ${schoolIds.length > 0 ? `WHERE school_id IN (${schoolIds.map(() => '?').join(', ')})` : ''}
    `;
    const studentCount = db.prepare(studentCountSql).get(...schoolIdParams) as { total: number; active: number };

    const today = new Date().toISOString().split('T')[0];
    const attendanceWhereConditions: string[] = ['DATE(check_in_time) = ?'];
    const attendanceParams: (string | number)[] = [today];

    if (schoolIds.length > 0) {
      attendanceWhereConditions.push(`school_id IN (${schoolIds.map(() => '?').join(', ')})`);
      attendanceParams.push(...schoolIds);
    }

    const attendanceClause = `WHERE ${attendanceWhereConditions.join(' AND ')}`;

    const todayAttendanceSql = `
      SELECT 
        COUNT(DISTINCT student_id) as total,
        SUM(CASE WHEN status IN ('normal', 'late') THEN 1 ELSE 0 END) as checked_in,
        COUNT(*) as check_ins
      FROM attendance_records
      ${attendanceClause}
    `;
    const todayAttendance = db.prepare(todayAttendanceSql).get(...attendanceParams) as {
      total: number;
      checked_in: number;
      check_ins: number;
    };

    const todayAttendanceRate = todayAttendance.total > 0
      ? Math.round((todayAttendance.checked_in / todayAttendance.total) * 10000) / 100
      : 0;

    const fundingWhere = schoolIds.length > 0
      ? `WHERE school_id IN (${schoolIds.map(() => '?').join(', ')})`
      : '';

    const fundingSql = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM funding_records
      ${fundingWhere}
    `;
    const fundingAmount = db.prepare(fundingSql).get(...schoolIdParams) as { total: number };

    const alertWhereConditions: string[] = ["status = 'pending'"];
    const alertParams: (string | number)[] = [];

    if (schoolIds.length > 0) {
      alertWhereConditions.push(`school_id IN (${schoolIds.map(() => '?').join(', ')})`);
      alertParams.push(...schoolIds);
    }

    const alertClause = `WHERE ${alertWhereConditions.join(' AND ')}`;

    const alertsSql = `
      SELECT COUNT(*) as total FROM alert_records ${alertClause}
    `;
    const pendingAlerts = db.prepare(alertsSql).get(...alertParams) as { total: number };

    const schoolStatsSql = `
      SELECT 
        s.id,
        s.name,
        COUNT(DISTINCT st.id) as student_count,
        ROUND(
          SUM(CASE WHEN ar.status IN ('normal', 'late') THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(COUNT(DISTINCT ar.student_id), 0), 
          2
        ) as attendance_rate
      FROM schools s
      LEFT JOIN students st ON s.id = st.school_id AND st.status = 'active'
      LEFT JOIN attendance_records ar ON s.id = ar.school_id AND DATE(ar.check_in_time) = ?
      WHERE s.id IN (${schools.map(() => '?').join(', ')})
      GROUP BY s.id
      ORDER BY s.id
    `;
    const schoolStats = db.prepare(schoolStatsSql).all(today, ...schools.map(s => s.id)) as any[];

    return {
      totalStudents: studentCount.total || 0,
      activeStudents: studentCount.active || 0,
      todayAttendanceRate,
      totalFundingAmount: fundingAmount.total || 0,
      pendingAlerts: pendingAlerts.total || 0,
      todayCheckIns: todayAttendance.check_ins || 0,
      schools: schoolStats.map(item => ({
        id: item.id,
        name: item.name,
        studentCount: item.student_count || 0,
        attendanceRate: item.attendance_rate || 0,
      })),
    };
  },
};

export default statisticsService;
