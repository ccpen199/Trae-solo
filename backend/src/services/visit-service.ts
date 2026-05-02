import { knex } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { auditEngine } from '../engines/audit-engine';
import { cdssEngine } from '../engines/cdss-engine';
import { digitalSignEngine } from '../engines/digital-sign-engine';

export interface Visit {
  id: string;
  visitNumber: string;
  patientId: string;
  patientName?: string;
  departmentId?: string;
  departmentName?: string;
  doctorId?: string;
  doctorName?: string;
  currentStatusId: string;
  currentStatusCode: string;
  currentStatusName: string;
  visitType: 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY' | 'FOLLOWUP';
  checkinTime: Date;
  startTime?: Date;
  endTime?: Date;
  roomNumber?: string;
  bedNumber?: string;
  chiefComplaint?: string;
  presentIllness?: string;
  pastHistory?: string;
  physicalExam?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  isArchived: boolean;
  qualityScore?: number;
  createdAt: Date;
}

export interface CreateVisitRequest {
  patientId: string;
  departmentId: string;
  doctorId?: string;
  visitType: 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY' | 'FOLLOWUP';
  roomNumber?: string;
  bedNumber?: string;
}

export interface UpdateVisitRequest {
  chiefComplaint?: string;
  presentIllness?: string;
  pastHistory?: string;
  physicalExam?: string;
  diagnosis?: string;
  treatmentPlan?: string;
}

export class VisitService {
  async createVisit(
    request: CreateVisitRequest,
    user: { id: string; username: string },
    ipAddress?: string
  ): Promise<Visit> {
    const patient = await knex('patients')
      .select('id', 'name')
      .where('id', request.patientId)
      .first();

    if (!patient) {
      throw new Error('患者不存在');
    }

    const pendingStatus = await knex('visit_statuses')
      .select('id', 'code', 'name')
      .where('code', 'PENDING')
      .first();

    if (!pendingStatus) {
      throw new Error('就诊状态配置错误');
    }

    const visitNumber = this.generateVisitNumber();

    const visitData = {
      id: uuidv4(),
      visit_number: visitNumber,
      patient_id: request.patientId,
      department_id: request.departmentId,
      doctor_id: request.doctorId,
      current_status_id: pendingStatus.id,
      visit_type: request.visitType,
      checkin_time: new Date(),
      room_number: request.roomNumber,
      bed_number: request.bedNumber,
    };

    await knex('visits').insert(visitData);

    await knex('visit_status_history').insert({
      id: uuidv4(),
      visit_id: visitData.id,
      status_id: pendingStatus.id,
      operator_id: user.id,
      remark: '患者挂号，进入待诊状态',
    });

    await auditEngine.logCreate(
      'VISIT',
      'visits',
      visitData.id,
      visitData,
      user,
      ipAddress,
      `创建就诊记录: ${visitNumber}`
    );

    return this.getVisitById(visitData.id);
  }

  async getVisitById(visitId: string): Promise<Visit> {
    const visit = await knex('visits')
      .leftJoin('patients', 'visits.patient_id', '=', 'patients.id')
      .leftJoin('departments', 'visits.department_id', '=', 'departments.id')
      .leftJoin('users as doctors', 'visits.doctor_id', '=', 'doctors.id')
      .leftJoin('visit_statuses', 'visits.current_status_id', '=', 'visit_statuses.id')
      .select(
        'visits.id',
        'visits.visit_number as visitNumber',
        'visits.patient_id as patientId',
        'patients.name as patientName',
        'visits.department_id as departmentId',
        'departments.name as departmentName',
        'visits.doctor_id as doctorId',
        'doctors.name as doctorName',
        'visits.current_status_id as currentStatusId',
        'visit_statuses.code as currentStatusCode',
        'visit_statuses.name as currentStatusName',
        'visits.visit_type as visitType',
        'visits.checkin_time as checkinTime',
        'visits.start_time as startTime',
        'visits.end_time as endTime',
        'visits.room_number as roomNumber',
        'visits.bed_number as bedNumber',
        'visits.chief_complaint as chiefComplaint',
        'visits.present_illness as presentIllness',
        'visits.past_history as pastHistory',
        'visits.physical_exam as physicalExam',
        'visits.diagnosis as diagnosis',
        'visits.treatment_plan as treatmentPlan',
        'visits.is_archived as isArchived',
        'visits.quality_score as qualityScore',
        'visits.created_at as createdAt'
      )
      .where('visits.id', visitId)
      .first();

    if (!visit) {
      throw new Error('就诊记录不存在');
    }

    return visit;
  }

  async getPatientVisitHistory(
    patientId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ visits: Visit[]; total: number }> {
    const countQuery = knex('visits')
      .count('* as count')
      .where('patient_id', patientId);
    const countResult = await countQuery.first();
    const total = parseInt(countResult?.count?.toString() || '0', 10);

    let query = knex('visits')
      .leftJoin('departments', 'visits.department_id', '=', 'departments.id')
      .leftJoin('users as doctors', 'visits.doctor_id', '=', 'doctors.id')
      .leftJoin('visit_statuses', 'visits.current_status_id', '=', 'visit_statuses.id')
      .select(
        'visits.id',
        'visits.visit_number as visitNumber',
        'visits.department_id as departmentId',
        'departments.name as departmentName',
        'visits.doctor_id as doctorId',
        'doctors.name as doctorName',
        'visits.current_status_id as currentStatusId',
        'visit_statuses.code as currentStatusCode',
        'visit_statuses.name as currentStatusName',
        'visits.visit_type as visitType',
        'visits.checkin_time as checkinTime',
        'visits.start_time as startTime',
        'visits.end_time as endTime',
        'visits.is_archived as isArchived',
        'visits.created_at as createdAt'
      )
      .where('visits.patient_id', patientId)
      .orderBy('visits.created_at', 'desc');

    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }

    const visits = await query;

    return { visits, total };
  }

  async updateVisit(
    visitId: string,
    request: UpdateVisitRequest,
    user: { id: string; username: string },
    ipAddress?: string
  ): Promise<Visit> {
    const visit = await knex('visits')
      .select('*')
      .where('id', visitId)
      .first();

    if (!visit) {
      throw new Error('就诊记录不存在');
    }

    if (visit.is_archived) {
      throw new Error('就诊记录已归档，无法修改');
    }

    const oldValue = { ...visit };

    const updateData: any = {};

    if (request.chiefComplaint !== undefined) {
      updateData.chief_complaint = request.chiefComplaint;
    }
    if (request.presentIllness !== undefined) {
      updateData.present_illness = request.presentIllness;
    }
    if (request.pastHistory !== undefined) {
      updateData.past_history = request.pastHistory;
    }
    if (request.physicalExam !== undefined) {
      updateData.physical_exam = request.physicalExam;
    }
    if (request.diagnosis !== undefined) {
      updateData.diagnosis = request.diagnosis;
    }
    if (request.treatmentPlan !== undefined) {
      updateData.treatment_plan = request.treatmentPlan;
    }

    updateData.updated_at = new Date();

    await knex('visits').where('id', visitId).update(updateData);

    await auditEngine.logUpdate(
      'VISIT',
      'visits',
      visitId,
      oldValue,
      { ...oldValue, ...updateData },
      user,
      ipAddress
    );

    return this.getVisitById(visitId);
  }

  async changeStatus(
    visitId: string,
    newStatusCode: string,
    user: { id: string; username: string },
    ipAddress?: string,
    reason?: string
  ): Promise<Visit> {
    const visit = await knex('visits')
      .select('*')
      .where('id', visitId)
      .first();

    if (!visit) {
      throw new Error('就诊记录不存在');
    }

    const newStatus = await knex('visit_statuses')
      .select('id', 'code', 'name')
      .where('code', newStatusCode)
      .first();

    if (!newStatus) {
      throw new Error('无效的状态');
    }

    const oldStatus = await knex('visit_statuses')
      .select('code', 'name')
      .where('id', visit.current_status_id)
      .first();

    const updateData: any = {
      current_status_id: newStatus.id,
      updated_at: new Date(),
    };

    if (newStatusCode === 'IN_CONSULTATION' && !visit.start_time) {
      updateData.start_time = new Date();
    }

    if (newStatusCode === 'ARCHIVED' && !visit.end_time) {
      updateData.end_time = new Date();
    }

    await knex('visits').where('id', visitId).update(updateData);

    await knex('visit_status_history').insert({
      id: uuidv4(),
      visit_id: visitId,
      status_id: newStatus.id,
      operator_id: user.id,
      remark: reason || `状态变更: ${oldStatus?.name || oldStatus?.code} -> ${newStatus.name}`,
    });

    await auditEngine.logStatusChange(
      'VISIT',
      'visits',
      visitId,
      oldStatus?.code || '',
      newStatusCode,
      user,
      ipAddress,
      reason
    );

    return this.getVisitById(visitId);
  }

  async getPendingVisits(
    doctorId?: string,
    departmentId?: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ visits: Visit[]; total: number }> {
    let baseQuery = knex('visits')
      .leftJoin('patients', 'visits.patient_id', '=', 'patients.id')
      .leftJoin('departments', 'visits.department_id', '=', 'departments.id')
      .leftJoin('users as doctors', 'visits.doctor_id', '=', 'doctors.id')
      .leftJoin('visit_statuses', 'visits.current_status_id', '=', 'visit_statuses.id');

    baseQuery = baseQuery.where('visit_statuses.code', 'IN', ['PENDING', 'IN_CONSULTATION', 'AWAITING_ORDER', 'ORDER_ISSUED', 'IN_EXECUTION']);

    if (doctorId) {
      baseQuery = baseQuery.where('visits.doctor_id', doctorId);
    }

    if (departmentId) {
      baseQuery = baseQuery.where('visits.department_id', departmentId);
    }

    const countQuery = baseQuery.clone().count('* as count');
    const countResult = await countQuery.first();
    const total = parseInt(countResult?.count?.toString() || '0', 10);

    let query = baseQuery
      .clone()
      .select(
        'visits.id',
        'visits.visit_number as visitNumber',
        'visits.patient_id as patientId',
        'patients.name as patientName',
        'visits.department_id as departmentId',
        'departments.name as departmentName',
        'visits.doctor_id as doctorId',
        'doctors.name as doctorName',
        'visits.current_status_id as currentStatusId',
        'visit_statuses.code as currentStatusCode',
        'visit_statuses.name as currentStatusName',
        'visits.visit_type as visitType',
        'visits.checkin_time as checkinTime',
        'visits.start_time as startTime',
        'visits.created_at as createdAt'
      )
      .orderBy('visits.checkin_time', 'asc');

    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }

    const visits = await query;

    return { visits, total };
  }

  async searchVisits(
    criteria: {
      patientName?: string;
      patientId?: string;
      visitNumber?: string;
      doctorId?: string;
      departmentId?: string;
      statusCode?: string;
      startDate?: Date;
      endDate?: Date;
    },
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ visits: Visit[]; total: number }> {
    let baseQuery = knex('visits')
      .leftJoin('patients', 'visits.patient_id', '=', 'patients.id')
      .leftJoin('departments', 'visits.department_id', '=', 'departments.id')
      .leftJoin('users as doctors', 'visits.doctor_id', '=', 'doctors.id')
      .leftJoin('visit_statuses', 'visits.current_status_id', '=', 'visit_statuses.id');

    if (criteria.patientName) {
      baseQuery = baseQuery.where('patients.name', 'like', `%${criteria.patientName}%`);
    }

    if (criteria.patientId) {
      baseQuery = baseQuery.where('visits.patient_id', criteria.patientId);
    }

    if (criteria.visitNumber) {
      baseQuery = baseQuery.where('visits.visit_number', 'like', `%${criteria.visitNumber}%`);
    }

    if (criteria.doctorId) {
      baseQuery = baseQuery.where('visits.doctor_id', criteria.doctorId);
    }

    if (criteria.departmentId) {
      baseQuery = baseQuery.where('visits.department_id', criteria.departmentId);
    }

    if (criteria.statusCode) {
      baseQuery = baseQuery.where('visit_statuses.code', criteria.statusCode);
    }

    if (criteria.startDate) {
      baseQuery = baseQuery.where('visits.checkin_time', '>=', criteria.startDate);
    }

    if (criteria.endDate) {
      baseQuery = baseQuery.where('visits.checkin_time', '<=', criteria.endDate);
    }

    const countQuery = baseQuery.clone().count('* as count');
    const countResult = await countQuery.first();
    const total = parseInt(countResult?.count?.toString() || '0', 10);

    let query = baseQuery
      .clone()
      .select(
        'visits.id',
        'visits.visit_number as visitNumber',
        'visits.patient_id as patientId',
        'patients.name as patientName',
        'visits.department_id as departmentId',
        'departments.name as departmentName',
        'visits.doctor_id as doctorId',
        'doctors.name as doctorName',
        'visits.current_status_id as currentStatusId',
        'visit_statuses.code as currentStatusCode',
        'visit_statuses.name as currentStatusName',
        'visits.visit_type as visitType',
        'visits.checkin_time as checkinTime',
        'visits.start_time as startTime',
        'visits.end_time as endTime',
        'visits.is_archived as isArchived',
        'visits.created_at as createdAt'
      )
      .orderBy('visits.checkin_time', 'desc');

    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }

    const visits = await query;

    return { visits, total };
  }

  private generateVisitNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `V${year}${month}${day}${random}`;
  }
}

export const visitService = new VisitService();
