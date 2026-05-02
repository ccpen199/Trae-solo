const prisma = require('../prisma');
const AuditService = require('../services/auditService');

class PrescriptionAiEngine {
  static async processPrescription(prescriptionId) {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId }
    });

    if (!prescription) {
      return { success: false, message: '处方不存在' };
    }

    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: 'PROCESSING' }
    });

    const extractedData = await this.simulateOcrExtraction(prescription);

    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: 'PENDING_REVIEW',
        extractedData,
        patientName: extractedData.patientName || prescription.patientName,
        patientIdNo: extractedData.patientIdNo || prescription.patientIdNo,
        patientPhone: extractedData.patientPhone || prescription.patientPhone,
        drugNames: extractedData.drugNames || prescription.drugNames
      }
    });

    await AuditService.createLog({
      action: 'UPDATE',
      tableName: 'Prescription',
      recordId: prescriptionId,
      oldValues: { status: 'UPLOADED' },
      newValues: { status: 'PENDING_REVIEW', extractedData },
      remark: '处方AI引擎完成识别，等待药师审核'
    });

    await this.createPharmacistNotification(updatedPrescription);

    return {
      success: true,
      prescription: updatedPrescription,
      extractedData
    };
  }

  static async simulateOcrExtraction(prescription) {
    const mockExtracts = [
      {
        patientName: '张三',
        patientIdNo: '110101199001011234',
        patientPhone: '13800138000',
        drugs: [
          { name: '阿莫西林胶囊', dosage: '每日3次，每次2粒', spec: '0.25g*24粒' },
          { name: '布洛芬缓释胶囊', dosage: '疼痛时服用，每次1粒', spec: '0.3g*20粒' }
        ],
        doctor: '李医生',
        hospital: '北京市第一人民医院',
        date: new Date().toISOString().split('T')[0]
      },
      {
        patientName: '李四',
        patientIdNo: '310101198505055678',
        patientPhone: '13900139000',
        drugs: [
          { name: '头孢克洛分散片', dosage: '每日2次，每次1片', spec: '0.25g*12片' }
        ],
        doctor: '王医生',
        hospital: '上海市第一人民医院',
        date: new Date().toISOString().split('T')[0]
      }
    ];

    const randomExtract = mockExtracts[Math.floor(Math.random() * mockExtracts.length)];
    
    return {
      ...randomExtract,
      drugNames: randomExtract.drugs.map(d => d.name).join(', ')
    };
  }

  static async createPharmacistNotification(prescription) {
    const pharmacists = await prisma.user.findMany({
      where: {
        role: 'PHARMACIST',
        isActive: true
      }
    });

    for (const pharmacist of pharmacists) {
      await prisma.notification.create({
        data: {
          type: 'PRESCRIPTION_REVIEW',
          title: '新处方待审核',
          content: `处方 ${prescription.prescriptionNo} - 患者: ${prescription.patientName}，药品: ${prescription.drugNames}，请及时审核。`,
          targetUserId: pharmacist.id
        }
      });
    }
  }

  static async reviewPrescription(prescriptionId, pharmacistId, approved, comment) {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId }
    });

    if (!prescription) {
      return { success: false, message: '处方不存在' };
    }

    if (prescription.status !== 'PENDING_REVIEW') {
      return { success: false, message: '处方状态不正确，无法审核' };
    }

    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewedById: pharmacistId,
        reviewedAt: new Date(),
        reviewComment: comment
      }
    });

    await AuditService.createLog({
      action: approved ? 'APPROVE' : 'REJECT',
      tableName: 'Prescription',
      recordId: prescriptionId,
      oldValues: { status: 'PENDING_REVIEW' },
      newValues: { status: approved ? 'APPROVED' : 'REJECTED', reviewComment: comment },
      operatorId: pharmacistId,
      remark: `药师审核处方：${approved ? '通过' : '拒绝'}`
    });

    return {
      success: true,
      prescription: updatedPrescription
    };
  }
}

module.exports = PrescriptionAiEngine;
