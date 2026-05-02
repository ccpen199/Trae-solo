const express = require('express');
const prisma = require('../prisma');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const GspComplianceEngine = require('../engines/GspComplianceEngine');
const FifoExpiryEngine = require('../engines/FifoExpiryEngine');
const InventorySettlementEngine = require('../engines/InventorySettlementEngine');
const AuditService = require('../services/auditService');

const router = express.Router();

router.get('/', authMiddleware, requireRoles('CASHIER', 'ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { status, patientName, startDate, endDate, page = 1, pageSize = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (patientName) where.patientName = { contains: patientName };
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        cashier: { select: { id: true, name: true, username: true } },
        prescription: true,
        items: {
          include: {
            drug: true,
            inventoryBatch: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * parseInt(pageSize),
      take: parseInt(pageSize)
    });

    const total = await prisma.sale.count({ where });

    res.json({
      success: true,
      data: sales,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: '获取销售单列表失败'
    });
  }
});

router.get('/:id', authMiddleware, requireRoles('CASHIER', 'ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        cashier: { select: { id: true, name: true, username: true } },
        prescription: {
          include: {
            reviewedBy: { select: { id: true, name: true, username: true } }
          }
        },
        items: {
          include: {
            drug: true,
            inventoryBatch: true
          }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: '销售单不存在'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: '获取销售单详情失败'
    });
  }
});

router.post('/', authMiddleware, requireRoles('CASHIER', 'ADMIN'), async (req, res) => {
  try {
    const { patientName, patientPhone, items, prescriptionId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '销售商品不能为空'
      });
    }

    const saleNo = `SO-${Date.now()}`;

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += (item.unitPrice || 0) * (item.quantity || 0);
    }

    const hasPrescriptionDrug = await prisma.drug.findFirst({
      where: {
        id: { in: items.map(i => i.drugId) },
        isPrescription: true
      }
    });

    if (hasPrescriptionDrug && !prescriptionId) {
      return res.status(400).json({
        success: false,
        message: '销售处方药必须提供处方'
      });
    }

    let saleStatus = 'DRAFT';
    if (prescriptionId) {
      const prescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId }
      });

      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: '处方不存在'
        });
      }

      if (prescription.status === 'PENDING_REVIEW' || prescription.status === 'PROCESSING') {
        saleStatus = 'PENDING_REVIEW';
      } else if (prescription.status === 'APPROVED') {
        saleStatus = 'APPROVED';
      } else if (prescription.status === 'REJECTED') {
        return res.status(400).json({
          success: false,
          message: '处方已被拒绝，无法用于销售'
        });
      }
    }

    const sale = await prisma.sale.create({
      data: {
        saleNo,
        status: saleStatus,
        totalAmount,
        patientName,
        patientPhone,
        prescriptionId,
        cashierId: req.user.id
      },
      include: {
        prescription: true
      }
    });

    await AuditService.createLog({
      action: 'CREATE',
      tableName: 'Sale',
      recordId: sale.id,
      newValues: {
        saleNo,
        status: saleStatus,
        totalAmount,
        patientName
      },
      operatorId: req.user.id,
      operatorName: req.user.name,
      remark: '创建销售单'
    });

    res.json({
      success: true,
      data: sale,
      message: saleStatus === 'PENDING_REVIEW' ? '销售单已创建，等待处方审核' : '销售单已创建'
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: '创建销售单失败'
    });
  }
});

router.post('/:id/approve', authMiddleware, requireRoles('CASHIER', 'ADMIN'), async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        prescription: true
      }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: '销售单不存在'
      });
    }

    if (sale.prescriptionId && sale.prescription) {
      if (sale.prescription.status !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: '处方未审核通过，无法销售'
        });
      }
    }

    const updatedSale = await prisma.sale.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED'
      }
    });

    await AuditService.createLog({
      action: 'UPDATE',
      tableName: 'Sale',
      recordId: sale.id,
      oldValues: { status: sale.status },
      newValues: { status: 'APPROVED' },
      operatorId: req.user.id,
      operatorName: req.user.name,
      remark: '销售单已审批通过'
    });

    res.json({
      success: true,
      data: updatedSale
    });
  } catch (error) {
    console.error('Approve sale error:', error);
    res.status(500).json({
      success: false,
      message: '审批销售单失败'
    });
  }
});

router.post('/:id/pay', authMiddleware, requireRoles('CASHIER', 'ADMIN'), async (req, res) => {
  try {
    const { paidAmount, patientName, patientPhone } = req.body;

    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        prescription: true,
        items: {
          include: {
            drug: true
          }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: '销售单不存在'
      });
    }

    if (sale.status !== 'APPROVED' && sale.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: '销售单状态不正确，无法支付'
      });
    }

    if (sale.prescriptionId && sale.prescription) {
      if (sale.prescription.status !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: '处方未审核通过，无法完成销售'
        });
      }
    }

    const unpaidItems = await prisma.saleItem.findMany({
      where: { saleId: sale.id }
    });

    if (unpaidItems.length === 0) {
      const drugs = await prisma.drug.findMany({
        where: { id: { in: (req.body.items || []).map(i => i.drugId) } }
      });
      
      let items = req.body.items || [];
      
      for (const item of items) {
        const drug = drugs.find(d => d.id === item.drugId);
        if (drug && drug.isPrescription && !sale.prescriptionId) {
          return res.status(400).json({
            success: false,
            message: `处方药 ${drug.name} 需要处方`
          });
        }
      }

      for (const item of items) {
        const allocations = await FifoExpiryEngine.allocateFifoInventory(
          item.drugId,
          item.quantity,
          sale.id,
          req.user.id
        );

        for (const allocation of allocations) {
          const batch = await prisma.inventoryBatch.findUnique({
            where: { id: allocation.batchId }
          });

          await prisma.saleItem.create({
            data: {
              saleId: sale.id,
              drugId: item.drugId,
              inventoryBatchId: allocation.batchId,
              quantity: allocation.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.unitPrice * allocation.quantity,
              batchNo: allocation.batchNo,
              expiryDate: batch.expiryDate
            }
          });
        }
      }
    }

    const invoiceNo = `INV-${Date.now()}`;
    const medicationGuide = this.generateMedicationGuide();

    const updatedSale = await prisma.sale.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        paidAmount: paidAmount || sale.totalAmount,
        paidAt: new Date(),
        completedAt: new Date(),
        invoiceNo,
        medicationGuide,
        patientName: patientName || sale.patientName,
        patientPhone: patientPhone || sale.patientPhone
      },
      include: {
        items: {
          include: {
            drug: true,
            inventoryBatch: true
          }
        },
        prescription: true
      }
    });

    if (sale.prescriptionId) {
      await prisma.prescription.update({
        where: { id: sale.prescriptionId },
        data: { status: 'USED' }
      });
    }

    await AuditService.createLog({
      action: 'UPDATE',
      tableName: 'Sale',
      recordId: sale.id,
      oldValues: { status: sale.status },
      newValues: { 
        status: 'COMPLETED',
        paidAmount: paidAmount || sale.totalAmount,
        invoiceNo
      },
      operatorId: req.user.id,
      operatorName: req.user.name,
      remark: '完成销售支付，扣减库存'
    });

    res.json({
      success: true,
      data: {
        ...updatedSale,
        medicationGuide
      },
      message: '销售完成，已生成电子发票和用药指导'
    });
  } catch (error) {
    console.error('Payment sale error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '支付操作失败'
    });
  }
});

router.post('/:id/refund', authMiddleware, requireRoles('CASHIER', 'ADMIN'), async (req, res) => {
  try {
    const { reason } = req.body;

    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            inventoryBatch: true
          }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: '销售单不存在'
      });
    }

    if (sale.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: '只有已完成的销售单可以退货'
      });
    }

    for (const item of sale.items) {
      await prisma.inventoryBatch.update({
        where: { id: item.inventoryBatchId },
        data: {
          availableQty: item.inventoryBatch.availableQty + item.quantity
        }
      });

      await prisma.inventoryAudit.create({
        data: {
          auditNo: `REF-${Date.now()}-${item.id}`,
          inventoryBatchId: item.inventoryBatchId,
          type: 'REFUND',
          beforeQty: item.inventoryBatch.availableQty,
          afterQty: item.inventoryBatch.availableQty + item.quantity,
          changeQty: item.quantity,
          reason: `销售退货 - 销售单号: ${sale.saleNo}`,
          relatedBizNo: sale.saleNo,
          operatorId: req.user.id
        }
      });
    }

    const updatedSale = await prisma.sale.update({
      where: { id: req.params.id },
      data: {
        status: 'REFUNDED'
      }
    });

    await AuditService.createLog({
      action: 'UPDATE',
      tableName: 'Sale',
      recordId: sale.id,
      oldValues: { status: 'COMPLETED' },
      newValues: { status: 'REFUNDED' },
      operatorId: req.user.id,
      operatorName: req.user.name,
      remark: `销售退货 - 原因: ${reason || '未说明'}`
    });

    res.json({
      success: true,
      data: updatedSale,
      message: '退货完成，库存已恢复'
    });
  } catch (error) {
    console.error('Refund sale error:', error);
    res.status(500).json({
      success: false,
      message: '退货操作失败'
    });
  }
});

router.post('/recall/initiate', authMiddleware, requireRoles('ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { batchNo, reason, isUrgent } = req.body;

    if (!batchNo || !reason) {
      return res.status(400).json({
        success: false,
        message: '批次号和召回原因不能为空'
      });
    }

    const result = await InventorySettlementEngine.createRecall(
      { batchNo, reason, isUrgent },
      req.user.id
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      data: result,
      message: `药品召回已启动，共涉及 ${result.recallList.patients.length} 位患者`
    });
  } catch (error) {
    console.error('Initiate recall error:', error);
    res.status(500).json({
      success: false,
      message: '启动药品召回失败'
    });
  }
});

router.get('/recall/list', authMiddleware, requireRoles('ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;

    const recalls = await prisma.drugRecall.findMany({
      include: {
        items: true,
        notifications: true
      },
      orderBy: { initiatedAt: 'desc' },
      skip: (page - 1) * parseInt(pageSize),
      take: parseInt(pageSize)
    });

    const total = await prisma.drugRecall.count();

    res.json({
      success: true,
      data: recalls,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (error) {
    console.error('Get recall list error:', error);
    res.status(500).json({
      success: false,
      message: '获取召回列表失败'
    });
  }
});

router.get('/recall/export/:batchNo', authMiddleware, requireRoles('ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const result = await InventorySettlementEngine.generateRecallList(req.params.batchNo);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      data: result.recallList,
      message: '召回列表导出成功'
    });
  } catch (error) {
    console.error('Export recall list error:', error);
    res.status(500).json({
      success: false,
      message: '导出召回列表失败'
    });
  }
});

router.generateMedicationGuide = function() {
  return `
【用药指导】

1. 请仔细阅读药品说明书，按医嘱或说明书规定的剂量和用法服用。
2. 如出现过敏反应或严重不良反应，请立即停药并就医。
3. 请将药品放置在儿童无法触及的地方。
4. 请在药品有效期内使用，过期药品请勿服用。
5. 如需咨询，请联系您的医生或药师。

【电子发票】
发票将通过短信发送至您的手机，请查收。
  `.trim();
};

module.exports = router;
