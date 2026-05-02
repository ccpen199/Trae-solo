const express = require('express');
const prisma = require('../prisma');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const PrescriptionAiEngine = require('../engines/PrescriptionAiEngine');
const GspComplianceEngine = require('../engines/GspComplianceEngine');
const AuditService = require('../services/auditService');

const router = express.Router();

router.get('/', authMiddleware, requireRoles('PHARMACIST', 'ADMIN', 'CASHIER'), async (req, res) => {
  try {
    const { status, patientName, page = 1, pageSize = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (patientName) where.patientName = { contains: patientName };

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        reviewedBy: { select: { id: true, name: true, username: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * parseInt(pageSize),
      take: parseInt(pageSize)
    });

    const total = await prisma.prescription.count({ where });

    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: '获取处方列表失败'
    });
  }
});

router.get('/:id', authMiddleware, requireRoles('PHARMACIST', 'ADMIN', 'CASHIER'), async (req, res) => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id },
      include: {
        reviewedBy: { select: { id: true, name: true, username: true } }
      }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: '处方不存在'
      });
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      success: false,
      message: '获取处方详情失败'
    });
  }
});

router.post('/', authMiddleware, requireRoles('CASHIER', 'ADMIN'), async (req, res) => {
  try {
    const { patientName, patientIdNo, patientPhone, drugNames, uploadedImage } = req.body;

    if (!patientName || !drugNames) {
      return res.status(400).json({
        success: false,
        message: '患者姓名和药品名称不能为空'
      });
    }

    const prescriptionNo = `RX-${Date.now()}`;

    const prescription = await prisma.prescription.create({
      data: {
        prescriptionNo,
        patientName,
        patientIdNo,
        patientPhone,
        drugNames,
        uploadedImage,
        status: 'UPLOADED'
      }
    });

    await AuditService.createLog({
      action: 'CREATE',
      tableName: 'Prescription',
      recordId: prescription.id,
      newValues: {
        prescriptionNo,
        patientName,
        drugNames,
        status: 'UPLOADED'
      },
      operatorId: req.user.id,
      operatorName: req.user.name,
      remark: '创建处方记录'
    });

    setTimeout(async () => {
      try {
        await PrescriptionAiEngine.processPrescription(prescription.id);
      } catch (err) {
        console.error('Prescription processing error:', err);
      }
    }, 1000);

    res.json({
      success: true,
      data: prescription,
      message: '处方已上传，正在进行AI识别...'
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      message: '创建处方记录失败'
    });
  }
});

router.post('/:id/process', authMiddleware, requireRoles('ADMIN'), async (req, res) => {
  try {
    const result = await PrescriptionAiEngine.processPrescription(req.params.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Process prescription error:', error);
    res.status(500).json({
      success: false,
      message: '处方处理失败'
    });
  }
});

router.post('/:id/review', authMiddleware, requireRoles('PHARMACIST', 'ADMIN'), async (req, res) => {
  try {
    const { approved, comment } = req.body;

    if (approved === undefined) {
      return res.status(400).json({
        success: false,
        message: '请提供审核结果'
      });
    }

    const result = await PrescriptionAiEngine.reviewPrescription(
      req.params.id,
      req.user.id,
      approved,
      comment
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      data: result.prescription
    });
  } catch (error) {
    console.error('Review prescription error:', error);
    res.status(500).json({
      success: false,
      message: '处方审核失败'
    });
  }
});

router.post('/:id/validate-drugs', authMiddleware, requireRoles('CASHIER', 'ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { saleItems } = req.body;

    if (!saleItems || saleItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供销售药品列表'
      });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: '处方不存在'
      });
    }

    const result = await GspComplianceEngine.validatePrescriptionDrugMatch(
      prescription,
      saleItems
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Validate prescription drugs error:', error);
    res.status(500).json({
      success: false,
      message: '处方药品校验失败'
    });
  }
});

module.exports = router;
