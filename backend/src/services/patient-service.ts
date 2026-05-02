import { knex } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { auditEngine } from '../engines/audit-engine';

export interface Patient {
  id: string;
  patientNumber: string;
  name: string;
  idCardNumber?: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthDate?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  allergies: string[];
  pastMedicalHistory: string[];
  familyHistory: string[];
  bloodType: 'A' | 'B' | 'AB' | 'O' | 'UNKNOWN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePatientRequest {
  name: string;
  idCardNumber?: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthDate?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  allergies?: string[];
  pastMedicalHistory?: string[];
  familyHistory?: string[];
  bloodType?: 'A' | 'B' | 'AB' | 'O' | 'UNKNOWN';
}

export interface PatientVisitHistory {
  visitId: string;
  visitNumber: string;
  departmentId: string;
  departmentName: string;
  doctorId: string;
  doctorName: string;
  visitType: string;
  checkinTime: Date;
  statusCode: string;
  statusName: string;
  chiefComplaint?: string;
  diagnosis?: string;
  isArchived: boolean;
}

export class PatientService {
  async createPatient(
    request: CreatePatientRequest,
    user: { id: string; username: string },
    ipAddress?: string
  ): Promise<Patient> {
    if (request.idCardNumber) {
      const existing = await knex('patients')
        .select('id')
        .where('id_card_number', request.idCardNumber)
        .first();

      if (existing) {
        throw new Error('身份证号已存在');
      }
    }

    const patientNumber = this.generatePatientNumber();

    const patientData = {
      id: uuidv4(),
      patient_number: patientNumber,
      name: request.name,
      id_card_number: request.idCardNumber || null,
      gender: request.gender,
      birth_date: request.birthDate || null,
      phone: request.phone || null,
      emergency_contact: request.emergencyContact || null,
      emergency_phone: request.emergencyPhone || null,
      address: request.address || null,
      allergies: request.allergies && request.allergies.length > 0
        ? JSON.stringify(request.allergies)
        : null,
      past_medical_history: request.pastMedicalHistory && request.pastMedicalHistory.length > 0
        ? JSON.stringify(request.pastMedicalHistory)
        : null,
      family_history: request.familyHistory && request.familyHistory.length > 0
        ? JSON.stringify(request.familyHistory)
        : null,
      blood_type: request.bloodType || 'UNKNOWN',
      is_active: true,
    };

    await knex('patients').insert(patientData);

    await auditEngine.logCreate(
      'PATIENT',
      'patients',
      patientData.id,
      patientData,
      user,
      ipAddress,
      `创建患者档案: ${patientNumber} - ${request.name}`
    );

    return this.getPatientById(patientData.id);
  }

  async getPatientById(patientId: string): Promise<Patient> {
    const patient = await knex('patients')
      .select('*')
      .where('id', patientId)
      .first();

    if (!patient) {
      throw new Error('患者不存在');
    }

    return this.mapPatient(patient);
  }

  async getPatientByNumber(patientNumber: string): Promise<Patient> {
    const patient = await knex('patients')
      .select('*')
      .where('patient_number', patientNumber)
      .first();

    if (!patient) {
      throw new Error('患者不存在');
    }

    return this.mapPatient(patient);
  }

  async searchPatients(
    criteria: {
      name?: string;
      patientNumber?: string;
      idCardNumber?: string;
      phone?: string;
    },
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ patients: Patient[]; total: number }> {
    let baseQuery = knex('patients');

    if (criteria.name) {
      baseQuery = baseQuery.where('name', 'like', `%${criteria.name}%`);
    }

    if (criteria.patientNumber) {
      baseQuery = baseQuery.where('patient_number', 'like', `%${criteria.patientNumber}%`);
    }

    if (criteria.idCardNumber) {
      baseQuery = baseQuery.where('id_card_number', 'like', `%${criteria.idCardNumber}%`);
    }

    if (criteria.phone) {
      baseQuery = baseQuery.where('phone', 'like', `%${criteria.phone}%`);
    }

    const countQuery = baseQuery.clone().count('* as count');
    const countResult = await countQuery.first();
    const total = parseInt(countResult?.count?.toString() || '0', 10);

    let query = baseQuery
      .clone()
      .select('*')
      .orderBy('created_at', 'desc');

    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }

    const patients = await query;

    return {
      patients: patients.map((p) => this.mapPatient(p)),
      total,
    };
  }

  async updatePatient(
    patientId: string,
    updates: Partial<CreatePatientRequest>,
    user: { id: string; username: string },
    ipAddress?: string
  ): Promise<Patient> {
    const patient = await knex('patients')
      .select('*')
      .where('id', patientId)
      .first();

    if (!patient) {
      throw new Error('患者不存在');
    }

    const oldValue = this.mapPatient(patient);

    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.idCardNumber !== undefined) updateData.id_card_number = updates.idCardNumber || null;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.birthDate !== undefined) updateData.birth_date = updates.birthDate || null;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.emergencyContact !== undefined) updateData.emergency_contact = updates.emergencyContact || null;
    if (updates.emergencyPhone !== undefined) updateData.emergency_phone = updates.emergencyPhone || null;
    if (updates.address !== undefined) updateData.address = updates.address || null;
    if (updates.bloodType !== undefined) updateData.blood_type = updates.bloodType;

    if (updates.allergies !== undefined) {
      updateData.allergies = updates.allergies && updates.allergies.length > 0
        ? JSON.stringify(updates.allergies)
        : null;
    }
    if (updates.pastMedicalHistory !== undefined) {
      updateData.past_medical_history = updates.pastMedicalHistory && updates.pastMedicalHistory.length > 0
        ? JSON.stringify(updates.pastMedicalHistory)
        : null;
    }
    if (updates.familyHistory !== undefined) {
      updateData.family_history = updates.familyHistory && updates.familyHistory.length > 0
        ? JSON.stringify(updates.familyHistory)
        : null;
    }

    updateData.updated_at = new Date();

    await knex('patients').where('id', patientId).update(updateData);

    const updatedPatient = await this.getPatientById(patientId);

    await auditEngine.logUpdate(
      'PATIENT',
      'patients',
      patientId,
      oldValue,
      updatedPatient,
      user,
      ipAddress,
      `更新患者档案: ${oldValue.patientNumber} - ${oldValue.name}`
    );

    return updatedPatient;
  }

  async getPatientVisitHistory(
    patientId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ visits: PatientVisitHistory[]; total: number }> {
    let baseQuery = knex('visits')
      .leftJoin('departments', 'visits.department_id', '=', 'departments.id')
      .leftJoin('users as doctors', 'visits.doctor_id', '=', 'doctors.id')
      .leftJoin('visit_statuses', 'visits.current_status_id', '=', 'visit_statuses.id')
      .where('visits.patient_id', patientId);

    const countQuery = baseQuery.clone().count('* as count');
    const countResult = await countQuery.first();
    const total = parseInt(countResult?.count?.toString() || '0', 10);

    let query = baseQuery
      .clone()
      .select(
        'visits.id as visitId',
        'visits.visit_number as visitNumber',
        'visits.department_id as departmentId',
        'departments.name as departmentName',
        'visits.doctor_id as doctorId',
        'doctors.name as doctorName',
        'visits.visit_type as visitType',
        'visits.checkin_time as checkinTime',
        'visit_statuses.code as statusCode',
        'visit_statuses.name as statusName',
        'visits.chief_complaint as chiefComplaint',
        'visits.diagnosis as diagnosis',
        'visits.is_archived as isArchived'
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

  async getPatientMedicalSummary(
    patientId: string
  ): Promise<{
    patient: Patient;
    visitCount: number;
    lastVisit?: PatientVisitHistory;
    activePrescriptions: any[];
    upcomingExams: any[];
  }> {
    const patient = await this.getPatientById(patientId);

    const visitCountResult = await knex('visits')
      .count('* as count')
      .where('patient_id', patientId)
      .first();
    const visitCount = parseInt(visitCountResult?.count?.toString() || '0', 10);

    const { visits } = await this.getPatientVisitHistory(patientId, { limit: 1 });
    const lastVisit = visits[0];

    const activePrescriptions = await knex('prescriptions')
      .leftJoin('patients', 'prescriptions.patient_id', '=', 'patients.id')
      .leftJoin('users as doctors', 'prescriptions.doctor_id', '=', 'doctors.id')
      .select(
        'prescriptions.id',
        'prescriptions.prescription_number as prescriptionNumber',
        'prescriptions.type',
        'prescriptions.status',
        'prescriptions.created_at as createdAt',
        'doctors.name as doctorName'
      )
      .where('prescriptions.patient_id', patientId)
      .whereIn('prescriptions.status', ['PENDING_REVIEW', 'APPROVED', 'CONFLICT'])
      .orderBy('prescriptions.created_at', 'desc');

    const upcomingExams = await knex('exam_orders')
      .leftJoin('patients', 'exam_orders.patient_id', '=', 'patients.id')
      .leftJoin('users as doctors', 'exam_orders.doctor_id', '=', 'doctors.id')
      .select(
        'exam_orders.id',
        'exam_orders.order_number as orderNumber',
        'exam_orders.exam_name as examName',
        'exam_orders.status',
        'exam_orders.scheduled_at as scheduledAt',
        'exam_orders.created_at as createdAt',
        'doctors.name as doctorName'
      )
      .where('exam_orders.patient_id', patientId)
      .whereIn('exam_orders.status', ['PENDING', 'IN_PROGRESS'])
      .orderBy('exam_orders.scheduled_at', 'asc');

    return {
      patient,
      visitCount,
      lastVisit,
      activePrescriptions,
      upcomingExams,
    };
  }

  private mapPatient(patient: any): Patient {
    return {
      id: patient.id,
      patientNumber: patient.patient_number,
      name: patient.name,
      idCardNumber: patient.id_card_number,
      gender: patient.gender,
      birthDate: patient.birth_date,
      phone: patient.phone,
      emergencyContact: patient.emergency_contact,
      emergencyPhone: patient.emergency_phone,
      address: patient.address,
      allergies: this.parseJsonArray(patient.allergies),
      pastMedicalHistory: this.parseJsonArray(patient.past_medical_history),
      familyHistory: this.parseJsonArray(patient.family_history),
      bloodType: patient.blood_type,
      isActive: patient.is_active,
      createdAt: patient.created_at,
      updatedAt: patient.updated_at,
    };
  }

  private parseJsonArray(value: string | null | undefined): string[] {
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(/[,，;；\s]+/).filter(Boolean);
    }
  }

  private generatePatientNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `P${year}${month}${day}${random}`;
  }
}

export const patientService = new PatientService();
