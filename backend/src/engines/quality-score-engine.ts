import { knex } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

export interface QualityCheckItem {
  id: string;
  category: string;
  name: string;
  description: string;
  required: boolean;
  weight: number;
  passed: boolean;
  message?: string;
  actualValue?: any;
}

export interface QualityCheckResult {
  overallScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  items: QualityCheckItem[];
  summary: {
    totalItems: number;
    passedItems: number;
    failedItems: number;
    missingRequired: string[];
  };
  checkedAt: Date;
}

export interface ArchiveResult {
  success: boolean;
  archiveId: string;
  archiveNumber: string;
  archivedAt: Date;
  qualityCheck: QualityCheckResult;
  message?: string;
  pdfPath?: string;
}

export class QualityScoreEngine {
  private readonly REQUIRED_FIELDS = {
    patientInfo: ['name', 'gender', 'birth_date'],
    visitInfo: ['department_id', 'doctor_id', 'visit_type'],
    diagnosis: ['chief_complaint', 'present_illness'],
  };

  private readonly SCORING_RULES = {
    patientInfo: 15,
    visitInfo: 10,
    chiefComplaint: 15,
    presentIllness: 20,
    pastHistory: 10,
    diagnosis: 15,
    prescriptions: 10,
    signature: 15,
  };

  private readonly PASS_THRESHOLD = 80;

  async checkVisitQuality(visitId: string): Promise<QualityCheckResult> {
    const items: QualityCheckItem[] = [];

    const visit = await knex('visits')
      .leftJoin('patients', 'visits.patient_id', '=', 'patients.id')
      .leftJoin('departments', 'visits.department_id', '=', 'departments.id')
      .leftJoin('users as doctors', 'visits.doctor_id', '=', 'doctors.id')
      .select(
        'visits.*',
        'patients.name as patient_name',
        'patients.gender as patient_gender',
        'patients.birth_date as patient_birth_date',
        'patients.allergies as patient_allergies',
        'patients.past_medical_history as patient_past_history',
        'departments.name as department_name',
        'doctors.name as doctor_name'
      )
      .where('visits.id', visitId)
      .first();

    if (!visit) {
      throw new Error('就诊记录不存在');
    }

    const prescriptions = await knex('prescriptions')
      .where('visit_id', visitId)
      .count('* as count')
      .first();

    const labOrders = await knex('lab_orders')
      .where('visit_id', visitId)
      .count('* as count')
      .first();

    const signatures = await knex('signatures')
      .where('record_id', visitId)
      .count('* as count')
      .first();

    items.push(this.checkPatientInfo(visit));
    items.push(this.checkVisitInfo(visit));
    items.push(this.checkChiefComplaint(visit));
    items.push(this.checkPresentIllness(visit));
    items.push(this.checkPastHistory(visit));
    items.push(this.checkDiagnosis(visit));
    items.push(this.checkOrders(
      Number(prescriptions?.count) || 0,
      Number(labOrders?.count) || 0
    ));
    items.push(this.checkSignature(Number(signatures?.count) || 0));

    const totalScore = items.reduce((sum, item) => sum + (item.passed ? item.weight : 0), 0);
    const maxScore = items.reduce((sum, item) => sum + item.weight, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);
    const passed = percentage >= this.PASS_THRESHOLD;

    const missingRequired: string[] = [];
    items.forEach((item) => {
      if (item.required && !item.passed) {
        missingRequired.push(item.name);
      }
    });

    return {
      overallScore: totalScore,
      maxScore,
      percentage,
      passed,
      items,
      summary: {
        totalItems: items.length,
        passedItems: items.filter((i) => i.passed).length,
        failedItems: items.filter((i) => !i.passed).length,
        missingRequired,
      },
      checkedAt: new Date(),
    };
  }

  private checkPatientInfo(visit: any): QualityCheckItem {
    const requiredFields = ['patient_name', 'patient_gender', 'patient_birth_date'];
    const missingFields: string[] = [];

    requiredFields.forEach((field) => {
      if (!visit[field]) {
        missingFields.push(field);
      }
    });

    const passed = missingFields.length === 0;

    return {
      id: uuidv4(),
      category: 'patient',
      name: '患者基本信息',
      description: '检查患者姓名、性别、出生日期等必填信息',
      required: true,
      weight: this.SCORING_RULES.patientInfo,
      passed,
      message: passed ? '患者信息完整' : `缺少必要信息: ${missingFields.join(', ')}`,
      actualValue: {
        name: visit.patient_name,
        gender: visit.patient_gender,
        birthDate: visit.patient_birth_date,
      },
    };
  }

  private checkVisitInfo(visit: any): QualityCheckItem {
    const requiredFields = ['department_id', 'doctor_id', 'visit_type'];
    const missingFields: string[] = [];

    requiredFields.forEach((field) => {
      if (!visit[field]) {
        missingFields.push(field);
      }
    });

    const passed = missingFields.length === 0;

    return {
      id: uuidv4(),
      category: 'visit',
      name: '就诊信息',
      description: '检查就诊科室、医生、就诊类型等信息',
      required: true,
      weight: this.SCORING_RULES.visitInfo,
      passed,
      message: passed ? '就诊信息完整' : `缺少必要信息: ${missingFields.join(', ')}`,
      actualValue: {
        department: visit.department_name,
        doctor: visit.doctor_name,
        visitType: visit.visit_type,
      },
    };
  }

  private checkChiefComplaint(visit: any): QualityCheckItem {
    const chiefComplaint = visit.chief_complaint;
    const passed = !!chiefComplaint && chiefComplaint.trim().length >= 5;

    return {
      id: uuidv4(),
      category: 'diagnosis',
      name: '主诉',
      description: '检查主诉是否填写完整（至少5个字符）',
      required: true,
      weight: this.SCORING_RULES.chiefComplaint,
      passed,
      message: passed ? '主诉填写完整' : '主诉未填写或内容不完整',
      actualValue: chiefComplaint,
    };
  }

  private checkPresentIllness(visit: any): QualityCheckItem {
    const presentIllness = visit.present_illness;
    const passed = !!presentIllness && presentIllness.trim().length >= 20;

    return {
      id: uuidv4(),
      category: 'diagnosis',
      name: '现病史',
      description: '检查现病史是否填写完整（至少20个字符）',
      required: true,
      weight: this.SCORING_RULES.presentIllness,
      passed,
      message: passed ? '现病史填写完整' : '现病史未填写或内容不完整',
      actualValue: presentIllness,
    };
  }

  private checkPastHistory(visit: any): QualityCheckItem {
    const pastHistory = visit.patient_past_history;
    const allergies = visit.patient_allergies;
    
    const hasPastHistory = !!pastHistory && pastHistory.trim().length > 0;
    const hasAllergies = !!allergies && allergies.trim().length > 0;
    
    const passed = hasPastHistory || hasAllergies;

    return {
      id: uuidv4(),
      category: 'history',
      name: '既往史/过敏史',
      description: '检查是否填写既往史或过敏史',
      required: false,
      weight: this.SCORING_RULES.pastHistory,
      passed,
      message: passed ? '既往史/过敏史已填写' : '建议填写既往史和过敏史',
      actualValue: {
        pastHistory: hasPastHistory,
        allergies: hasAllergies,
      },
    };
  }

  private checkDiagnosis(visit: any): QualityCheckItem {
    const diagnosis = visit.diagnosis;
    const passed = !!diagnosis && diagnosis.trim().length >= 5;

    return {
      id: uuidv4(),
      category: 'diagnosis',
      name: '诊断',
      description: '检查诊断是否填写完整（至少5个字符）',
      required: true,
      weight: this.SCORING_RULES.diagnosis,
      passed,
      message: passed ? '诊断填写完整' : '诊断未填写或内容不完整',
      actualValue: diagnosis,
    };
  }

  private checkOrders(prescriptionCount: number, labOrderCount: number): QualityCheckItem {
    const hasOrders = prescriptionCount > 0 || labOrderCount > 0;

    return {
      id: uuidv4(),
      category: 'orders',
      name: '医嘱/检查',
      description: '检查是否开出处方或检查单',
      required: false,
      weight: this.SCORING_RULES.prescriptions,
      passed: hasOrders,
      message: hasOrders 
        ? `已开具 ${prescriptionCount} 张处方，${labOrderCount} 张检查单` 
        : '未开具处方或检查单（可选）',
      actualValue: {
        prescriptions: prescriptionCount,
        labOrders: labOrderCount,
      },
    };
  }

  private checkSignature(signatureCount: number): QualityCheckItem {
    const passed = signatureCount > 0;

    return {
      id: uuidv4(),
      category: 'signature',
      name: '电子签名',
      description: '检查是否已完成电子签名',
      required: true,
      weight: this.SCORING_RULES.signature,
      passed,
      message: passed ? '已完成电子签名' : '需要完成电子签名才能归档',
      actualValue: signatureCount,
    };
  }

  async canArchive(visitId: string): Promise<{
    canArchive: boolean;
    qualityCheck: QualityCheckResult;
    reason?: string;
  }> {
    const visit = await knex('visits')
      .select('status', 'is_archived as isArchived')
      .where('id', visitId)
      .first();

    if (!visit) {
      return {
        canArchive: false,
        qualityCheck: {
          overallScore: 0,
          maxScore: 0,
          percentage: 0,
          passed: false,
          items: [],
          summary: {
            totalItems: 0,
            passedItems: 0,
            failedItems: 0,
            missingRequired: [],
          },
          checkedAt: new Date(),
        },
        reason: '就诊记录不存在',
      };
    }

    if (visit.isArchived) {
      return {
        canArchive: false,
        qualityCheck: {
          overallScore: 0,
          maxScore: 0,
          percentage: 0,
          passed: false,
          items: [],
          summary: {
            totalItems: 0,
            passedItems: 0,
            failedItems: 0,
            missingRequired: [],
          },
          checkedAt: new Date(),
        },
        reason: '病历已归档',
      };
    }

    const qualityCheck = await this.checkVisitQuality(visitId);

    if (!qualityCheck.passed) {
      return {
        canArchive: false,
        qualityCheck,
        reason: `病历质量评分未达标（${qualityCheck.percentage}% < ${this.PASS_THRESHOLD}%）`,
      };
    }

    if (qualityCheck.summary.missingRequired.length > 0) {
      return {
        canArchive: false,
        qualityCheck,
        reason: `缺少必填项: ${qualityCheck.summary.missingRequired.join(', ')}`,
      };
    }

    return {
      canArchive: true,
      qualityCheck,
    };
  }

  async performQualityCheck(
    visitId: string,
    user: { id: string; username: string; name: string },
    ipAddress?: string
  ): Promise<QualityCheckResult> {
    const qualityCheck = await this.checkVisitQuality(visitId);

    await knex('quality_checks').insert({
      id: uuidv4(),
      visit_id: visitId,
      overall_score: qualityCheck.overallScore,
      max_score: qualityCheck.maxScore,
      percentage: qualityCheck.percentage,
      passed: qualityCheck.passed,
      check_result: JSON.stringify(qualityCheck),
      checked_by: user.id,
      checked_at: new Date(),
      created_at: new Date(),
    });

    return qualityCheck;
  }
}

export const qualityScoreEngine = new QualityScoreEngine();
