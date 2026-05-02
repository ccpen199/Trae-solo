const express = require('express');
const prisma = require('../prisma');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const GspComplianceEngine = require('../engines/GspComplianceEngine');
const FifoExpiryEngine = require('../engines/FifoExpiryEngine');
const AuditService = require('../services/auditService');

const router = express.Router();

router.get('/', authMiddleware, requireRoles('PURCHASER', 'ADMIN', 'WAREHOUSE_KEEPER'), async (req, res) => {
  try {
    const { status, supplierId, page = 1, pageSize = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: true,
        requestedBy: { select: { id: true, name: true, username: true } },
        items: {
          include: {
            drug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * parseInt(pageSize),
      take: parseInt(pageSize)
    });

    const total = await prisma.purchase.count({ where });

    res.json({
      success: true,
      data: purchases,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: '获取采购单列表失败'
    });
  }
});

router.get('/:id', authMiddleware, requireRoles('PURCHASER', 'ADMIN', 'WAREHOUSE_KEEPER'), async (req, res) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        requestedBy: { select: { id: true, name: true, username: true } },
        items: {
          include: {
            drug: true
          }
        }
      }
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: '采购单不存在'
      });
    }

    res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      success: false,
      message: '获取采购单详情失败'
    });
  }
});

router.post('/', authMiddleware, requireRoles('PURCHASER', 'ADMIN'), async (req, res) => {
  try {
    const { supplierId, items, remark } = req.body;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '供应商和采购物品不能为空'
      });
    }

    const validation = await GspComplianceEngine.validatePurchase({ supplierId });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: '供应商资质校验失败',
        issues: validation.issues
      });
    }

    const purchaseNo = `PO-${Date.now()}`;

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += (item.unitPrice || 0) * (item.quantity || 0);
    }

    const purchase = await prisma.purchase.create({
      data: {
        purchaseNo,
        supplierId,
        status: 'DRAFT',
        totalAmount,
        requestedById: req.user.id,
        remark,
        items: {
          create: items.map(item => ({
            drugId: item.drugId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0
          }))
        }
      },
      include: {
        items: {
          include: {
            drug: true
          }
        }
      }
    });

    await AuditService.createLog({
      action: 'CREATE',
      tableName: 'Purchase',
      recordId: purchase.id,
      newValues: { purchaseNo, supplierId, status: 'DRAFT' },
      operatorId: req.user.id,
      operatorName: req.user.name,
      remark: '创建采购申请单'
    });

    res.json({
      success: true,
      data: purchase,
      validation
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({
      success: false,
      message: '创建采购单失败'
    });
  }
});

router.post('/:id/submit', authMiddleware, requireRoles('PURCHASER', 'ADMIN'), async (req, res) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: req.params.id }
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: '采购单不存在'
      });
    }

    if (purchase.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: '只有草稿状态的采购单可以提交'
      });
    }

    const validation = await GspComplianceEngine.validatePurchase(purchase);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: '供应商资质校验失败，无法提交',
        issues: validation.issues
      });
    }

    const updatedPurchase = await prisma.purchase.update({
      where: { id: req.params.id },
      data: {
        status: 'PURCHASING',
        approvedById: req.user.id,
        approvedAt: new Date()
      },
      include: {
        items: {
          include: {
            drug: true
          }
        }
      }
    });

    await AuditService.createLog({
      action: 'UPDATE',
      tableName: 'Purchase',
      recordId: purchase.id,
      oldValues: { status: 'DRAFT' },
      newValues: { status: 'PURCHASING' },
      operatorId: req.user.id,
      operatorName: req.user.name,
      remark: '提交采购申请，状态更新为采购中'
    });

    res.json({
      success: true,
      data: updatedPurchase
    });
  } catch (error) {
    console.error('Submit purchase error:', error);
    res.status(500).json({
      success: false,
      message: '提交采购单失败'
    });
  }
});

router.post('/:id/receive', authMiddleware, requireRoles('WAREHOUSE_KEEPER', 'ADMIN'), async (req, res) => {
  try {
    const { receivedItems } = req.body;

    const purchase = await prisma.purchase.findUnique({
      where: { id: req.params.id },
      include: {
        items: true
      }
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: '采购单不存在'
      });
    }

    if (purchase.status !== 'PURCHASING') {
      return res.status(400).json({
        success: false,
        message: '只有采购中状态的采购单可以收货'
      });
    }

    const items = purchase.items;
    const inventoryBatches = [];

    for (const item of items) {
      const receivedItem = receivedItems.find(ri => ri.purchaseItemId === item.id);
      
      if (!receivedItem) {
        return res.status(400).json({
          success: false,
          message: `采购物品 ${item.id} 未提供收货信息`
        });
      }

      if (!receivedItem.batchNo) {
        return res.status(400).json({
          success: false,
          message: '必须提供批次号'
        });
      }

      if (!receivedItem.expiryDate) {
        return res.status(400).json({
          success: false,
          message: '必须提供效期'
        });
      }

      const batch = await prisma.inventoryBatch.create({
        data: {
          drugId: item.drugId,
          batchNo: receivedItem.batchNo,
          expiryDate: new Date(receivedItem.expiryDate),
          totalQuantity: receivedItem.receivedQty,
          availableQty: receivedItem.receivedQty,
          unitCost: item.unitPrice,
          status: 'IN_STOCK',
          purchaseItemId: item.id
        }
      });

      inventoryBatches.push(batch);

      await prisma.purchaseItem.update({
        where: { id: item.id },
        data: {
          batchNo: receivedItem.batchNo,
          expiryDate: new Date(receivedItem.expiryDate),
          receivedQty: receivedItem.receivedQty
        }
      });

      await FifoExpiryEngine.checkBatchExpiry(batch);
    }

    const updatedPurchase = await prisma.purchase.update({
      where: { id: req.params.id },
      data: {
        status: 'INSPECTING',
        receivedAt: new Date()
      },
      include: {
        items: {
          include: {
            drug: true
          }
        }
      }
    });

    await AuditService.createLog({
      action: 'UPDATE',
      tableName: 'Purchase',
      recordId: purchase.id,
      oldValues: { status: 'PURCHASING' },
      newValues: { status: 'INSPECTING' },
      operatorId: req.user.id,
      operatorName: req.user.name,
      remark: '完成收货，状态更新为入库待检'
    });

    res.json({
      success: true,
      data: {
        purchase: updatedPurchase,
        inventoryBatches
      }
    });
  } catch (error) {
    console.error('Receive purchase error:', error);
    res.status(500).json({
      success: false,
      message: '收货操作失败'
    });
  }
});

router.post('/:id/complete', authMiddleware, requireRoles('WAREHOUSE_KEEPER', 'ADMIN'), async (req, res) => {
  try {
    const { inspectionStatus } = req.body;

    const purchase = await prisma.purchase.findUnique({
      where: { id: req.params.id },
      include: {
        items: true
      }
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: '采购单不存在'
      });
    }

    if (purchase.status !== 'INSPECTING') {
      return res.status(400).json({
        success: false,
        message: '只有入库待检状态的采购单可以完成'
      });
    }

    const updatedPurchase = await prisma.purchase.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        inspectedAt: new Date(),
        completedAt: new Date()
      },
      include: {
        items: {
          include: {
            drug: true
          }
        }
      }
    });

    await AuditService.createLog({
      action: 'UPDATE',
      tableName: 'Purchase',
      recordId: purchase.id,
      oldValues: { status: 'INSPECTING' },
      newValues: { status: 'COMPLETED' },
      operatorId: req.user.id,
      operatorName: req.user.name,
      remark: '验收完成，采购单状态更新为已完成'
    });

    res.json({
      success: true,
      data: updatedPurchase
    });
  } catch (error) {
    console.error('Complete purchase error:', error);
    res.status(500).json({
      success: false,
      message: '完成采购单操作失败'
    });
  }
});

module.exports = router;
