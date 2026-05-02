import { knex } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { qualityScoreEngine, QualityCheckResult } from '../engines/quality-score-engine';
import { auditEngine } from '../engines/audit-engine';
import { digitalSignEngine } from '../engines/digital-sign-engine';

export interface ArchiveRecord {
  id: string;
  archiveNumber: string;
  visitId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  departmentName: string;
  qualityScore: number;
  qualityCheckResult: QualityCheckResult;
  pdfPath?: string;
  pdfContent?: string;
  archivedAt: Date;
  archivedBy: string;
  archivedByName: string;
  createdAt: Date;
}

export class ArchiveService {
  async archiveVisit(
    visitId: string,
    user: { id: string; username: string; name: string },
    ipAddress?: string
  ): Promise<ArchiveRecord> {
    const canArchiveResult = await qualityScoreEngine.canArchive(visitId);

    if (!canArchiveResult.canArchive) {
      throw new Error(canArchiveResult.reason || '病历不满足归档条件');
    }

    const trx = await knex.transaction();

    try {
      const visit = await trx('visits')
        .leftJoin('patients', 'visits.patient_id', '=', 'patients.id')
        .leftJoin('departments', 'visits.department_id', '=', 'departments.id')
        .leftJoin('users as doctors', 'visits.doctor_id', '=', 'doctors.id')
        .select(
          'visits.id',
          'visits.patient_id as patientId',
          'patients.name as patientName',
          'visits.doctor_id as doctorId',
          'doctors.name as doctorName',
          'departments.name as departmentName',
          'visits.chief_complaint as chiefComplaint',
          'visits.present_illness as presentIllness',
          'visits.diagnosis',
          'visits.status'
        )
        .where('visits.id', visitId)
        .first();

      if (!visit) {
        await trx.rollback();
        throw new Error('就诊记录不存在');
      }

      const prescriptions = await trx('prescriptions')
        .leftJoin('users as prescribers', 'prescriptions.doctor_id', '=', 'prescribers.id')
        .select(
          'prescriptions.id',
          'prescriptions.prescription_number as prescriptionNumber',
          'prescriptions.type',
          'prescriptions.status',
          'prescriptions.signed_at as signedAt',
          'prescribers.name as prescriberName'
        )
        .where('prescriptions.visit_id', visitId)
        .orderBy('prescriptions.created_at', 'desc');

      const prescriptionItems: any[] = [];
      for (const p of prescriptions) {
        const items = await trx('prescription_items')
          .select(
            'drug_name as drugName',
            'specification',
            'quantity',
            'unit',
            'dosage',
            'frequency',
            'route',
            'instructions'
          )
          .where('prescription_id', p.id)
          .orderBy('sort_order', 'asc');
        
        prescriptionItems.push({
          ...p,
          items,
        });
      }

      const labOrders = await trx('lab_orders')
        .leftJoin('users as orderers', 'lab_orders.doctor_id', '=', 'orderers.id')
        .select(
          'lab_orders.id',
          'lab_orders.order_number as orderNumber',
          'lab_orders.type',
          'lab_orders.status',
          'lab_orders.urgency',
          'lab_orders.result',
          'lab_orders.completed_at as completedAt',
          'orderers.name as ordererName'
        )
        .where('lab_orders.visit_id', visitId)
        .orderBy('lab_orders.created_at', 'desc');

      const archiveNumber = this.generateArchiveNumber();

      const pdfContent = this.generatePdfContent({
        visit,
        prescriptions: prescriptionItems,
        labOrders,
        archiveNumber,
        qualityCheck: canArchiveResult.qualityCheck,
      });

      const archiveData = {
        id: uuidv4(),
        archive_number: archiveNumber,
        visit_id: visitId,
        patient_id: visit.patientId,
        patient_name: visit.patientName,
        doctor_id: visit.doctorId,
        doctor_name: visit.doctorName,
        department_name: visit.departmentName,
        quality_score: canArchiveResult.qualityCheck.percentage,
        quality_check_result: JSON.stringify(canArchiveResult.qualityCheck),
        pdf_content: pdfContent,
        archived_by: user.id,
        archived_at: new Date(),
        created_at: new Date(),
      };

      await trx('archives').insert(archiveData);

      await trx('visits')
        .where('id', visitId)
        .update({
          status: 'COMPLETED',
          is_archived: true,
          archived_at: new Date(),
          updated_at: new Date(),
        });

      await trx('visit_status_history').insert({
        id: uuidv4(),
        visit_id: visitId,
        from_status: visit.status,
        to_status: 'COMPLETED',
        changed_by: user.id,
        reason: '病历归档完成',
        created_at: new Date(),
      });

      await trx.commit();

      await auditEngine.log({
        userId: user.id,
        username: user.username,
        action: 'ARCHIVE',
        module: 'ARCHIVE',
        tableName: 'visits',
        recordId: visitId,
        ipAddress,
        description: `病历归档完成，归档编号: ${archiveNumber}，质量评分: ${canArchiveResult.qualityCheck.percentage}%`,
      });

      return {
        id: archiveData.id,
        archiveNumber,
        visitId,
        patientId: visit.patientId,
        patientName: visit.patientName,
        doctorId: visit.doctorId,
        doctorName: visit.doctorName,
        departmentName: visit.departmentName,
        qualityScore: canArchiveResult.qualityCheck.percentage,
        qualityCheckResult: canArchiveResult.qualityCheck,
        pdfContent,
        archivedAt: archiveData.archived_at,
        archivedBy: user.id,
        archivedByName: user.name,
        createdAt: archiveData.created_at,
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async getArchiveById(archiveId: string): Promise<ArchiveRecord | null> {
    const archive = await knex('archives')
      .leftJoin('users as archivers', 'archives.archived_by', '=', 'archivers.id')
      .select(
        'archives.id',
        'archives.archive_number as archiveNumber',
        'archives.visit_id as visitId',
        'archives.patient_id as patientId',
        'archives.patient_name as patientName',
        'archives.doctor_id as doctorId',
        'archives.doctor_name as doctorName',
        'archives.department_name as departmentName',
        'archives.quality_score as qualityScore',
        'archives.quality_check_result as qualityCheckResult',
        'archives.pdf_path as pdfPath',
        'archives.pdf_content as pdfContent',
        'archives.archived_at as archivedAt',
        'archives.archived_by as archivedBy',
        'archivers.name as archivedByName',
        'archives.created_at as createdAt'
      )
      .where('archives.id', archiveId)
      .first();

    if (!archive) {
      return null;
    }

    return {
      ...archive,
      qualityCheckResult: typeof archive.qualityCheckResult === 'string' 
        ? JSON.parse(archive.qualityCheckResult) 
        : archive.qualityCheckResult,
    };
  }

  async getArchiveByVisitId(visitId: string): Promise<ArchiveRecord | null> {
    const archive = await knex('archives')
      .leftJoin('users as archivers', 'archives.archived_by', '=', 'archivers.id')
      .select(
        'archives.id',
        'archives.archive_number as archiveNumber',
        'archives.visit_id as visitId',
        'archives.patient_id as patientId',
        'archives.patient_name as patientName',
        'archives.doctor_id as doctorId',
        'archives.doctor_name as doctorName',
        'archives.department_name as departmentName',
        'archives.quality_score as qualityScore',
        'archives.quality_check_result as qualityCheckResult',
        'archives.pdf_path as pdfPath',
        'archives.pdf_content as pdfContent',
        'archives.archived_at as archivedAt',
        'archives.archived_by as archivedBy',
        'archivers.name as archivedByName',
        'archives.created_at as createdAt'
      )
      .where('archives.visit_id', visitId)
      .orderBy('archives.created_at', 'desc')
      .first();

    if (!archive) {
      return null;
    }

    return {
      ...archive,
      qualityCheckResult: typeof archive.qualityCheckResult === 'string' 
        ? JSON.parse(archive.qualityCheckResult) 
        : archive.qualityCheckResult,
    };
  }

  async getPatientArchives(
    patientId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ archives: ArchiveRecord[]; total: number }> {
    let baseQuery = knex('archives')
      .leftJoin('users as archivers', 'archives.archived_by', '=', 'archivers.id')
      .where('archives.patient_id', patientId);

    const countQuery = baseQuery.clone().count('* as count');
    const countResult = await countQuery.first();
    const total = Number(countResult?.count) || 0;

    let query = baseQuery
      .clone()
      .select(
        'archives.id',
        'archives.archive_number as archiveNumber',
        'archives.visit_id as visitId',
        'archives.patient_id as patientId',
        'archives.patient_name as patientName',
        'archives.doctor_id as doctorId',
        'archives.doctor_name as doctorName',
        'archives.department_name as departmentName',
        'archives.quality_score as qualityScore',
        'archives.archived_at as archivedAt',
        'archivers.name as archivedByName'
      )
      .orderBy('archives.archived_at', 'desc');

    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }

    const archives = await query;

    return {
      archives,
      total,
    };
  }

  private generateArchiveNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `AR${year}${month}${day}${random}`;
  }

  private generatePdfContent(data: {
    visit: any;
    prescriptions: any[];
    labOrders: any[];
    archiveNumber: string;
    qualityCheck: QualityCheckResult;
  }): string {
    const now = new Date().toLocaleString('zh-CN');

    return `
================================================================================
                              电子病历归档报告
================================================================================

【归档信息】
归档编号：${data.archiveNumber}
归档时间：${now}
质量评分：${data.qualityCheck.percentage}%
通过状态：${data.qualityCheck.passed ? '✅ 通过' : '❌ 未通过'}

--------------------------------------------------------------------------------

【就诊信息】
就诊ID：${data.visit.id}
患者姓名：${data.visit.patientName}
接诊医生：${data.visit.doctorName}
就诊科室：${data.visit.departmentName}

--------------------------------------------------------------------------------

【诊断记录】
▌主诉：
${data.visit.chiefComplaint || '未填写'}

▌现病史：
${data.visit.presentIllness || '未填写'}

▌诊断：
${data.visit.diagnosis || '未填写'}

--------------------------------------------------------------------------------

【处方记录】
${data.prescriptions.length === 0 ? '（无处方记录）' : ''}
${data.prescriptions.map((p, index) => `
处方 ${index + 1}：
  处方编号：${p.prescriptionNumber}
  处方类型：${p.type === 'REGULAR' ? '普通处方' : p.type === 'EMERGENCY' ? '急诊处方' : p.type}
  处方状态：${p.status}
  开具医生：${p.prescriberName}
  药品列表：
${p.items.map((item: any) => `
    - ${item.drugName} ${item.specification || ''}
      数量：${item.quantity} ${item.unit}
      用法：${item.dosage} ${item.frequency} ${item.route}
      ${item.instructions ? `备注：${item.instructions}` : ''}
`).join('')}
`).join('')}

--------------------------------------------------------------------------------

【检查检验记录】
${data.labOrders.length === 0 ? '（无检查检验记录）' : ''}
${data.labOrders.map((order, index) => `
检查 ${index + 1}：
  检查编号：${order.orderNumber}
  检查类型：${order.type === 'LAB' ? '检验' : order.type === 'IMAGING' ? '影像' : '功能检查'}
  紧急程度：${order.urgency === 'STAT' ? '加急' : order.urgency === 'URGENT' ? '紧急' : '普通'}
  检查状态：${order.status}
  开具医生：${order.ordererName}
  检查结果：
${order.result || '（无结果记录）'}
`).join('')}

--------------------------------------------------------------------------------

【质量检查详情】
总项目数：${data.qualityCheck.summary.totalItems}
通过项目：${data.qualityCheck.summary.passedItems}
未通过项目：${data.qualityCheck.summary.failedItems}
${data.qualityCheck.summary.missingRequired.length > 0 ? `缺失必填项：${data.qualityCheck.summary.missingRequired.join(', ')}` : ''}

检查项目详情：
${data.qualityCheck.items.map((item) => `
  [${item.passed ? '✓' : '✗'}] ${item.name} (${item.weight}分)
      ${item.message}
`).join('')}

================================================================================
                      本报告由电子病历系统自动生成
                      生成时间：${now}
================================================================================
    `.trim();
  }
}

export const archiveService = new ArchiveService();
