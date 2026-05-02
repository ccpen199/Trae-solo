import { knex } from '../database/connection';
import moment from 'moment';

export interface DailyVisitStats {
  date: string;
  totalVisits: number;
  newPatients: number;
  followUpPatients: number;
  completedVisits: number;
  cancelledVisits: number;
}

export interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  totalVisits: number;
  pendingVisits: number;
  inProgressVisits: number;
  completedVisits: number;
  totalDoctors: number;
}

export interface DoctorPerformance {
  doctorId: string;
  doctorName: string;
  departmentName: string;
  totalVisits: number;
  totalPrescriptions: number;
  totalLabOrders: number;
  avgVisitDuration: number;
  patientSatisfaction?: number;
}

export interface PrescriptionStats {
  totalPrescriptions: number;
  pendingPrescriptions: number;
  approvedPrescriptions: number;
  dispensedPrescriptions: number;
  conflictPrescriptions: number;
  overridePrescriptions: number;
  topDrugs: {
    drugName: string;
    count: number;
  }[];
}

export interface LabStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  abnormalResults: number;
  avgTurnaroundTime: number;
}

export interface AuditSummary {
  totalLogs: number;
  loginCount: number;
  logoutCount: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
  signCount: number;
  topActions: {
    action: string;
    count: number;
  }[];
  topUsers: {
    userId: string;
    username: string;
    count: number;
  }[];
}

export class ReportService {
  async getDailyVisitStats(
    startDate: Date,
    endDate: Date
  ): Promise<DailyVisitStats[]> {
    const visits = await knex('visits')
      .select(
        knex.raw('DATE(created_at) as date'),
        knex.raw('COUNT(*) as totalVisits'),
        knex.raw(`SUM(CASE WHEN visit_type = 'NEW' THEN 1 ELSE 0 END) as newPatients`),
        knex.raw(`SUM(CASE WHEN visit_type = 'FOLLOW_UP' THEN 1 ELSE 0 END) as followUpPatients`),
        knex.raw(`SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completedVisits`),
        knex.raw(`SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledVisits`)
      )
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .groupBy(knex.raw('DATE(created_at)'))
      .orderBy('date', 'asc');

    return visits.map((v: any) => ({
      date: moment(v.date).format('YYYY-MM-DD'),
      totalVisits: Number(v.totalVisits) || 0,
      newPatients: Number(v.newPatients) || 0,
      followUpPatients: Number(v.followUpPatients) || 0,
      completedVisits: Number(v.completedVisits) || 0,
      cancelledVisits: Number(v.cancelledVisits) || 0,
    }));
  }

  async getDepartmentStats(): Promise<DepartmentStats[]> {
    const departments = await knex('departments')
      .select(
        'departments.id as departmentId',
        'departments.name as departmentName',
        knex.raw('COUNT(DISTINCT visits.id) as totalVisits'),
        knex.raw(`COUNT(DISTINCT CASE WHEN visits.status = 'PENDING' THEN visits.id END) as pendingVisits`),
        knex.raw(`COUNT(DISTINCT CASE WHEN visits.status = 'IN_PROGRESS' THEN visits.id END) as inProgressVisits`),
        knex.raw(`COUNT(DISTINCT CASE WHEN visits.status = 'COMPLETED' THEN visits.id END) as completedVisits`),
        knex.raw('COUNT(DISTINCT users.id) as totalDoctors')
      )
      .leftJoin('users', 'departments.id', '=', 'users.department_id')
      .leftJoin('visits', 'users.id', '=', 'visits.doctor_id')
      .groupBy('departments.id', 'departments.name')
      .orderBy('totalVisits', 'desc');

    return departments.map((d: any) => ({
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      totalVisits: Number(d.totalVisits) || 0,
      pendingVisits: Number(d.pendingVisits) || 0,
      inProgressVisits: Number(d.inProgressVisits) || 0,
      completedVisits: Number(d.completedVisits) || 0,
      totalDoctors: Number(d.totalDoctors) || 0,
    }));
  }

  async getDoctorPerformance(
    startDate?: Date,
    endDate?: Date
  ): Promise<DoctorPerformance[]> {
    let baseQuery = knex('users')
      .leftJoin('roles', 'users.role_id', '=', 'roles.id')
      .leftJoin('departments', 'users.department_id', '=', 'departments.id')
      .where('roles.code', 'DOCTOR')
      .select(
        'users.id as doctorId',
        'users.name as doctorName',
        'departments.name as departmentName',
        knex.raw('COUNT(DISTINCT visits.id) as totalVisits'),
        knex.raw('COUNT(DISTINCT prescriptions.id) as totalPrescriptions'),
        knex.raw('COUNT(DISTINCT lab_orders.id) as totalLabOrders')
      )
      .leftJoin('visits', (join) => {
        join.on('users.id', '=', 'visits.doctor_id');
        if (startDate) join.andOn('visits.created_at', '>=', knex.raw('?', [startDate]));
        if (endDate) join.andOn('visits.created_at', '<=', knex.raw('?', [endDate]));
      })
      .leftJoin('prescriptions', (join) => {
        join.on('users.id', '=', 'prescriptions.doctor_id');
        if (startDate) join.andOn('prescriptions.created_at', '>=', knex.raw('?', [startDate]));
        if (endDate) join.andOn('prescriptions.created_at', '<=', knex.raw('?', [endDate]));
      })
      .leftJoin('lab_orders', (join) => {
        join.on('users.id', '=', 'lab_orders.doctor_id');
        if (startDate) join.andOn('lab_orders.created_at', '>=', knex.raw('?', [startDate]));
        if (endDate) join.andOn('lab_orders.created_at', '<=', knex.raw('?', [endDate]));
      })
      .groupBy('users.id', 'users.name', 'departments.name')
      .orderBy('totalVisits', 'desc');

    const doctors = await baseQuery;

    return doctors.map((d: any) => ({
      doctorId: d.doctorId,
      doctorName: d.doctorName,
      departmentName: d.departmentName,
      totalVisits: Number(d.totalVisits) || 0,
      totalPrescriptions: Number(d.totalPrescriptions) || 0,
      totalLabOrders: Number(d.totalLabOrders) || 0,
      avgVisitDuration: 0,
    }));
  }

  async getPrescriptionStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<PrescriptionStats> {
    let baseQuery = knex('prescriptions');

    if (startDate) baseQuery = baseQuery.where('created_at', '>=', startDate);
    if (endDate) baseQuery = baseQuery.where('created_at', '<=', endDate);

    const stats = await baseQuery
      .clone()
      .select(
        knex.raw('COUNT(*) as totalPrescriptions'),
        knex.raw(`SUM(CASE WHEN status = 'DRAFT' OR status = 'PENDING_REVIEW' THEN 1 ELSE 0 END) as pendingPrescriptions`),
        knex.raw(`SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approvedPrescriptions`),
        knex.raw(`SUM(CASE WHEN status = 'DISPENSED' THEN 1 ELSE 0 END) as dispensedPrescriptions`),
        knex.raw(`SUM(CASE WHEN status = 'CONFLICT' THEN 1 ELSE 0 END) as conflictPrescriptions`),
        knex.raw(`SUM(CASE WHEN doctor_override_reason IS NOT NULL THEN 1 ELSE 0 END) as overridePrescriptions`)
      )
      .first();

    const topDrugs = await knex('prescription_items')
      .select(
        'drug_name as drugName',
        knex.raw('COUNT(*) as count')
      )
      .groupBy('drug_name')
      .orderBy('count', 'desc')
      .limit(10);

    return {
      totalPrescriptions: Number(stats?.totalPrescriptions) || 0,
      pendingPrescriptions: Number(stats?.pendingPrescriptions) || 0,
      approvedPrescriptions: Number(stats?.approvedPrescriptions) || 0,
      dispensedPrescriptions: Number(stats?.dispensedPrescriptions) || 0,
      conflictPrescriptions: Number(stats?.conflictPrescriptions) || 0,
      overridePrescriptions: Number(stats?.overridePrescriptions) || 0,
      topDrugs: topDrugs.map((d: any) => ({
        drugName: d.drugName,
        count: Number(d.count) || 0,
      })),
    };
  }

  async getLabStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<LabStats> {
    let baseQuery = knex('lab_orders');

    if (startDate) baseQuery = baseQuery.where('created_at', '>=', startDate);
    if (endDate) baseQuery = baseQuery.where('created_at', '<=', endDate);

    const stats = await baseQuery
      .clone()
      .select(
        knex.raw('COUNT(*) as totalOrders'),
        knex.raw(`SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pendingOrders`),
        knex.raw(`SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as inProgressOrders`),
        knex.raw(`SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completedOrders`),
        knex.raw(`SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledOrders`)
      )
      .first();

    const abnormalResult = await knex('lab_order_items')
      .where('is_abnormal', true)
      .count('* as count')
      .first();

    return {
      totalOrders: Number(stats?.totalOrders) || 0,
      pendingOrders: Number(stats?.pendingOrders) || 0,
      inProgressOrders: Number(stats?.inProgressOrders) || 0,
      completedOrders: Number(stats?.completedOrders) || 0,
      cancelledOrders: Number(stats?.cancelledOrders) || 0,
      abnormalResults: Number(abnormalResult?.count) || 0,
      avgTurnaroundTime: 0,
    };
  }

  async getAuditSummary(
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditSummary> {
    let baseQuery = knex('audit_logs');

    if (startDate) baseQuery = baseQuery.where('created_at', '>=', startDate);
    if (endDate) baseQuery = baseQuery.where('created_at', '<=', endDate);

    const stats = await baseQuery
      .clone()
      .select(
        knex.raw('COUNT(*) as totalLogs'),
        knex.raw(`SUM(CASE WHEN action = 'LOGIN' THEN 1 ELSE 0 END) as loginCount`),
        knex.raw(`SUM(CASE WHEN action = 'LOGOUT' THEN 1 ELSE 0 END) as logoutCount`),
        knex.raw(`SUM(CASE WHEN action = 'CREATE' THEN 1 ELSE 0 END) as createCount`),
        knex.raw(`SUM(CASE WHEN action = 'UPDATE' THEN 1 ELSE 0 END) as updateCount`),
        knex.raw(`SUM(CASE WHEN action = 'DELETE' THEN 1 ELSE 0 END) as deleteCount`),
        knex.raw(`SUM(CASE WHEN action = 'SIGN' THEN 1 ELSE 0 END) as signCount`)
      )
      .first();

    const topActions = await baseQuery
      .clone()
      .select(
        'action',
        knex.raw('COUNT(*) as count')
      )
      .groupBy('action')
      .orderBy('count', 'desc')
      .limit(10);

    const topUsers = await baseQuery
      .clone()
      .select(
        'user_id as userId',
        'username',
        knex.raw('COUNT(*) as count')
      )
      .groupBy('user_id', 'username')
      .orderBy('count', 'desc')
      .limit(10);

    return {
      totalLogs: Number(stats?.totalLogs) || 0,
      loginCount: Number(stats?.loginCount) || 0,
      logoutCount: Number(stats?.logoutCount) || 0,
      createCount: Number(stats?.createCount) || 0,
      updateCount: Number(stats?.updateCount) || 0,
      deleteCount: Number(stats?.deleteCount) || 0,
      signCount: Number(stats?.signCount) || 0,
      topActions: topActions.map((a: any) => ({
        action: a.action,
        count: Number(a.count) || 0,
      })),
      topUsers: topUsers.map((u: any) => ({
        userId: u.userId,
        username: u.username,
        count: Number(u.count) || 0,
      })),
    };
  }

  async getDashboardSummary(): Promise<{
    todayVisits: number;
    pendingVisits: number;
    inProgressVisits: number;
    totalPatients: number;
    pendingPrescriptions: number;
    pendingLabOrders: number;
    recentActivities: {
      id: string;
      action: string;
      module: string;
      description: string;
      username: string;
      createdAt: Date;
    }[];
  }> {
    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'day');

    const todayVisits = await knex('visits')
      .where('created_at', '>=', today.toDate())
      .where('created_at', '<', tomorrow.toDate())
      .count('* as count')
      .first();

    const pendingStatus = await knex('visit_statuses')
      .where('code', 'PENDING')
      .select('id')
      .first();

    const inConsultationStatus = await knex('visit_statuses')
      .where('code', 'IN_CONSULTATION')
      .select('id')
      .first();

    const pendingVisits = await knex('visits')
      .where('current_status_id', pendingStatus?.id || '')
      .count('* as count')
      .first();

    const inProgressVisits = await knex('visits')
      .where('current_status_id', inConsultationStatus?.id || '')
      .count('* as count')
      .first();

    const totalPatients = await knex('patients')
      .count('* as count')
      .first();

    const pendingPrescriptions = await knex('prescriptions')
      .whereIn('status', ['DRAFT', 'PENDING_REVIEW', 'CONFLICT'])
      .count('* as count')
      .first();

    const pendingLabOrders = await knex('lab_orders')
      .whereIn('status', ['PENDING', 'IN_PROGRESS'])
      .count('* as count')
      .first();

    const recentActivities = await knex('audit_logs')
      .select(
        'id',
        'action',
        'module',
        'description',
        'username',
        'created_at as createdAt'
      )
      .orderBy('created_at', 'desc')
      .limit(20);

    return {
      todayVisits: Number(todayVisits?.count) || 0,
      pendingVisits: Number(pendingVisits?.count) || 0,
      inProgressVisits: Number(inProgressVisits?.count) || 0,
      totalPatients: Number(totalPatients?.count) || 0,
      pendingPrescriptions: Number(pendingPrescriptions?.count) || 0,
      pendingLabOrders: Number(pendingLabOrders?.count) || 0,
      recentActivities: recentActivities.map((a: any) => ({
        id: a.id,
        action: a.action,
        module: a.module,
        description: a.description,
        username: a.username,
        createdAt: a.createdAt,
      })),
    };
  }
}

export const reportService = new ReportService();
