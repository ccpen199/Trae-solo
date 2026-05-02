import { knex } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { auditEngine } from '../engines/audit-engine';
import { cdssEngine, CDSSAlert } from '../engines/cdss-engine';
import { digitalSignEngine } from '../engines/digital-sign-engine';

export interface PrescriptionItem {
  id: string;
  drugId?: string;
  drugName: string;
  specification?: string;
  quantity: number;
  unit: string;
  dosage: string;
  frequency: string;
  route: string;
  instructions?: string;
  price?: number;
  subtotal?: number;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  visitId: string;
  patientId: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  type: 'REGULAR' | 'EMERGENCY' | 'NARCOTIC' | 'PSYCHIATRIC';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'CONFLICT' | 'APPROVED' | 'DISPENSED' | 'CANCELLED';
  conflictMessage?: string;
  doctorOverrideReason?: string;
  items: PrescriptionItem[];
  signedBy?: string;
  signedByName?: string;
  signedAt?: Date;
  signature?: string;
  dispensedAt?: Date;
  dispensedBy?: string;
  dispensedByName?: string;
  remark?: string;
  createdAt: Date;
}

export interface CreatePrescriptionRequest {
  visitId: string;
  type: 'REGULAR' | 'EMERGENCY' | 'NARCOTIC' | 'PSYCHIATRIC';
  items: Omit<PrescriptionItem, 'id' | 'price' | 'subtotal'>[];
  remark?: string;
}

export interface PrescriptionValidationResult {
  valid: boolean;
  alerts: CDSSAlert[];
  requiresOverride: boolean;
}

export class PrescriptionService {
  async createPrescription(
    request: CreatePrescriptionRequest,
    user: { id: string; username: string; name: string },
    ipAddress?: string
  ): Promise<{
    prescription: Prescription;
    validation: PrescriptionValidationResult;
  }> {
    const visit = await knex('visits')
      .leftJoin('patients', 'visits.patient_id', '=', 'patients.id')
      .select(
        'visits.id',
        'visits.patient_id as patientId',
        'patients.name as patientName',
        'patients.gender as patientGender',
        'patients.birth_date as patientBirthDate',
        'patients.allergies as patientAllergies'
      )
      .where('visits.id', request.visitId)
      .first();

    if (!visit) {
      throw new Error('就诊记录不存在');
    }

    const prescriptionNumber = this.generatePrescriptionNumber();

    const prescriptionData = {
      id: uuidv4(),
      prescription_number: prescriptionNumber,
      visit_id: request.visitId,
      patient_id: visit.patientId,
      doctor_id: user.id,
      type: request.type,
      status: 'DRAFT' as const,
      remark: request.remark,
    };

    await knex('prescriptions').insert(prescriptionData);

    const items: PrescriptionItem[] = [];
    for (let i = 0; i < request.items.length; i++) {
      const item = request.items[i];

      const drug = await knex('drugs')
        .select('id', 'generic_name', 'specification', 'unit', 'price')
        .where('id', item.drugId)
        .first();

      const itemData = {
        id: uuidv4(),
        prescription_id: prescriptionData.id,
        drug_id: item.drugId,
        drug_name: item.drugName || drug?.generic_name || '',
        specification: item.specification || drug?.specification,
        quantity: item.quantity,
        unit: item.unit || drug?.unit || '片',
        dosage: item.dosage,
        frequency: item.frequency,
        route: item.route,
        instructions: item.instructions,
        price: drug?.price || 0,
        subtotal: (drug?.price || 0) * item.quantity,
        sort_order: i,
      };

      await knex('prescription_items').insert(itemData);

      items.push({
        id: itemData.id,
        drugId: itemData.drug_id,
        drugName: itemData.drug_name,
        specification: itemData.specification,
        quantity: itemData.quantity,
        unit: itemData.unit,
        dosage: itemData.dosage,
        frequency: itemData.frequency,
        route: itemData.route,
        instructions: itemData.instructions,
        price: itemData.price,
        subtotal: itemData.subtotal,
      });
    }

    await auditEngine.logCreate(
      'PRESCRIPTION',
      'prescriptions',
      prescriptionData.id,
      { ...prescriptionData, items },
      user,
      ipAddress,
      `创建处方: ${prescriptionNumber}`
    );

    const patientAge = visit.patientBirthDate
      ? this.calculateAge(visit.patientBirthDate)
      : undefined;

    const patientAllergies = this.parseAllergies(visit.patientAllergies);

    const validation = await this.validatePrescription({
      patientId: visit.patientId,
      patientGender: visit.patientGender,
      patientAge,
      patientAllergies,
      items: items.map((i) => ({
        drugId: i.drugId,
        drugName: i.drugName,
        dosage: i.dosage,
        frequency: i.frequency,
        route: i.route,
        quantity: i.quantity,
      })),
    });

    if (!validation.valid) {
      await knex('prescriptions')
        .where('id', prescriptionData.id)
        .update({
          status: 'CONFLICT',
          conflict_message: validation.alerts.map((a) => a.message).join('; '),
          updated_at: new Date(),
        });
    }

    const prescription = await this.getPrescriptionById(prescriptionData.id);

    return { prescription, validation };
  }

  async validatePrescription(context: {
    patientId: string;
    patientGender: string;
    patientAge?: number;
    patientAllergies: string[];
    items: {
      drugId?: string;
      drugName: string;
      drugCode?: string;
      dosage: string;
      frequency: string;
      route: string;
      quantity: number;
    }[];
  }): Promise<PrescriptionValidationResult> {
    const result = await cdssEngine.validatePrescription(context);

    return {
      valid: result.valid,
      alerts: result.alerts,
      requiresOverride: result.requiresOverride,
    };
  }

  async overrideConflict(
    prescriptionId: string,
    overrideReason: string,
    user: { id: string; username: string; name: string },
    ipAddress?: string
  ): Promise<Prescription> {
    const prescription = await knex('prescriptions')
      .select('*')
      .where('id', prescriptionId)
      .first();

    if (!prescription) {
      throw new Error('处方不存在');
    }

    if (prescription.status !== 'CONFLICT') {
      throw new Error('处方没有冲突需要忽略');
    }

    const oldValue = { ...prescription };

    await knex('prescriptions')
      .where('id', prescriptionId)
      .update({
        status: 'PENDING_REVIEW',
        doctor_override_reason: overrideReason,
        conflict_message: null,
        updated_at: new Date(),
      });

    await auditEngine.logCDSSAlert(
      'PRESCRIPTION_CONFLICT',
      '处方冲突忽略',
      'OVERRIDE',
      'OVERRIDE',
      user,
      ipAddress,
      { prescriptionId, overrideReason }
    );

    await auditEngine.logUpdate(
      'PRESCRIPTION',
      'prescriptions',
      prescriptionId,
      oldValue,
      { ...oldValue, status: 'PENDING_REVIEW', doctor_override_reason: overrideReason },
      user,
      ipAddress,
      `忽略处方冲突，原因: ${overrideReason}`
    );

    return this.getPrescriptionById(prescriptionId);
  }

  async signPrescription(
    prescriptionId: string,
    user: { id: string; username: string; name: string; certificateNumber?: string },
    ipAddress?: string
  ): Promise<Prescription> {
    const prescription = await this.getPrescriptionById(prescriptionId);

    if (prescription.status !== 'DRAFT' && prescription.status !== 'PENDING_REVIEW') {
      throw new Error('处方状态不允许签名');
    }

    const prescriptionContent = JSON.stringify({
      prescriptionNumber: prescription.prescriptionNumber,
      patientId: prescription.patientId,
      patientName: prescription.patientName,
      doctorId: prescription.doctorId,
      doctorName: prescription.doctorName,
      type: prescription.type,
      items: prescription.items,
      timestamp: new Date().toISOString(),
    });

    const signResult = await digitalSignEngine.signAndLock(
      'prescriptions',
      prescriptionId,
      prescriptionContent,
      user,
      ipAddress,
      { prescriptionNumber: prescription.prescriptionNumber }
    );

    if (!signResult.success) {
      throw new Error(`签名失败: ${signResult.error}`);
    }

    await knex('prescriptions')
      .where('id', prescriptionId)
      .update({
        status: 'APPROVED',
        signed_by: user.id,
        signed_at: new Date(),
        signature: signResult.signature,
        updated_at: new Date(),
      });

    await auditEngine.logSign(
      'PRESCRIPTION',
      'prescriptions',
      prescriptionId,
      user,
      ipAddress,
      { prescriptionNumber: prescription.prescriptionNumber }
    );

    return this.getPrescriptionById(prescriptionId);
  }

  async dispensePrescription(
    prescriptionId: string,
    user: { id: string; username: string; name: string },
    ipAddress?: string
  ): Promise<Prescription> {
    const prescription = await knex('prescriptions')
      .select('*')
      .where('id', prescriptionId)
      .first();

    if (!prescription) {
      throw new Error('处方不存在');
    }

    if (prescription.status !== 'APPROVED') {
      throw new Error('处方状态不允许发药');
    }

    const oldValue = { ...prescription };

    await knex('prescriptions')
      .where('id', prescriptionId)
      .update({
        status: 'DISPENSED',
        dispensed_by: user.id,
        dispensed_at: new Date(),
        updated_at: new Date(),
      });

    await auditEngine.logStatusChange(
      'PRESCRIPTION',
      'prescriptions',
      prescriptionId,
      'APPROVED',
      'DISPENSED',
      user,
      ipAddress,
      '处方发药'
    );

    return this.getPrescriptionById(prescriptionId);
  }

  async getPrescriptionById(prescriptionId: string): Promise<Prescription> {
    const prescription = await knex('prescriptions')
      .leftJoin('patients', 'prescriptions.patient_id', '=', 'patients.id')
      .leftJoin('users as doctors', 'prescriptions.doctor_id', '=', 'doctors.id')
      .leftJoin('users as dispensers', 'prescriptions.dispensed_by', '=', 'dispensers.id')
      .select(
        'prescriptions.id',
        'prescriptions.prescription_number as prescriptionNumber',
        'prescriptions.visit_id as visitId',
        'prescriptions.patient_id as patientId',
        'patients.name as patientName',
        'prescriptions.doctor_id as doctorId',
        'doctors.name as doctorName',
        'prescriptions.type',
        'prescriptions.status',
        'prescriptions.conflict_message as conflictMessage',
        'prescriptions.doctor_override_reason as doctorOverrideReason',
        'prescriptions.signed_by as signedBy',
        'doctors.name as signedByName',
        'prescriptions.signed_at as signedAt',
        'prescriptions.signature',
        'prescriptions.dispensed_at as dispensedAt',
        'prescriptions.dispensed_by as dispensedBy',
        'dispensers.name as dispensedByName',
        'prescriptions.remark',
        'prescriptions.created_at as createdAt'
      )
      .where('prescriptions.id', prescriptionId)
      .first();

    if (!prescription) {
      throw new Error('处方不存在');
    }

    const items = await knex('prescription_items')
      .select(
        'id',
        'drug_id as drugId',
        'drug_name as drugName',
        'specification',
        'quantity',
        'unit',
        'dosage',
        'frequency',
        'route',
        'instructions',
        'price',
        'subtotal'
      )
      .where('prescription_id', prescriptionId)
      .orderBy('sort_order', 'asc');

    return {
      ...prescription,
      items,
    };
  }

  async getVisitPrescriptions(visitId: string): Promise<Prescription[]> {
    const prescriptions = await knex('prescriptions')
      .leftJoin('patients', 'prescriptions.patient_id', '=', 'patients.id')
      .leftJoin('users as doctors', 'prescriptions.doctor_id', '=', 'doctors.id')
      .select(
        'prescriptions.id',
        'prescriptions.prescription_number as prescriptionNumber',
        'prescriptions.visit_id as visitId',
        'prescriptions.patient_id as patientId',
        'patients.name as patientName',
        'prescriptions.doctor_id as doctorId',
        'doctors.name as doctorName',
        'prescriptions.type',
        'prescriptions.status',
        'prescriptions.conflict_message as conflictMessage',
        'prescriptions.signed_at as signedAt',
        'prescriptions.dispensed_at as dispensedAt',
        'prescriptions.created_at as createdAt'
      )
      .where('prescriptions.visit_id', visitId)
      .orderBy('prescriptions.created_at', 'desc');

    const results: Prescription[] = [];

    for (const p of prescriptions) {
      const items = await knex('prescription_items')
        .select(
          'id',
          'drug_id as drugId',
          'drug_name as drugName',
          'specification',
          'quantity',
          'unit',
          'dosage',
          'frequency',
          'route',
          'instructions',
          'price',
          'subtotal'
        )
        .where('prescription_id', p.id)
        .orderBy('sort_order', 'asc');

      results.push({
        ...p,
        items,
      });
    }

    return results;
  }

  async getPendingPrescriptions(
    userRole: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ prescriptions: Prescription[]; total: number }> {
    let baseQuery = knex('prescriptions')
      .leftJoin('patients', 'prescriptions.patient_id', '=', 'patients.id')
      .leftJoin('users as doctors', 'prescriptions.doctor_id', '=', 'doctors.id');

    if (userRole === 'PHARMACIST') {
      baseQuery = baseQuery.whereIn('prescriptions.status', ['APPROVED']);
    } else if (userRole === 'DOCTOR') {
      baseQuery = baseQuery.whereIn('prescriptions.status', ['DRAFT', 'CONFLICT', 'PENDING_REVIEW']);
    } else {
      baseQuery = baseQuery.whereNotIn('prescriptions.status', ['CANCELLED']);
    }

    const countQuery = baseQuery.clone().count('* as count');
    const countResult = await countQuery.first();
    const total = parseInt(countResult?.count?.toString() || '0', 10);

    let query = baseQuery
      .clone()
      .select(
        'prescriptions.id',
        'prescriptions.prescription_number as prescriptionNumber',
        'prescriptions.visit_id as visitId',
        'prescriptions.patient_id as patientId',
        'patients.name as patientName',
        'prescriptions.doctor_id as doctorId',
        'doctors.name as doctorName',
        'prescriptions.type',
        'prescriptions.status',
        'prescriptions.conflict_message as conflictMessage',
        'prescriptions.signed_at as signedAt',
        'prescriptions.dispensed_at as dispensedAt',
        'prescriptions.created_at as createdAt'
      )
      .orderBy('prescriptions.created_at', 'desc');

    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }

    const prescriptions = await query;

    return { prescriptions: prescriptions as Prescription[], total };
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  private parseAllergies(allergiesText: string | null | undefined): string[] {
    if (!allergiesText) return [];

    try {
      const parsed = JSON.parse(allergiesText);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') {
        return parsed.split(/[,，;；\s]+/).filter(Boolean);
      }
      return [];
    } catch {
      return allergiesText.split(/[,，;；\s]+/).filter(Boolean);
    }
  }

  private generatePrescriptionNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `RX${year}${month}${day}${random}`;
  }
}

export const prescriptionService = new PrescriptionService();
