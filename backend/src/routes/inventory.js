const express = require('express');
const prisma = require('../prisma');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const FifoExpiryEngine = require('../engines/FifoExpiryEngine');
const InventorySettlementEngine = require('../engines/InventorySettlementEngine');
const AuditService = require('../services/auditService');

const router = express.Router();

router.get('/batches', authMiddleware, requireRoles('WAREHOUSE_KEEPER', 'ADMIN', 'CASHIER'), async (req, res) => {
  try {
    const { drugId, status, batchNo, page = 1, pageSize = 20 } = req.query;
    
    const where = {};
    if (drugId) where.drugId = drugId;
    if (status) where.status = status;
    if (batchNo) where.batchNo = { contains: batchNo };

    const batches = await prisma.inventoryBatch.findMany({
      where,
      include: {
        drug: true
      },
      orderBy: [
        { expiryDate: 'asc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * parseInt(pageSize),
      take: parseInt(pageSize)
    });

    const total = await prisma.inventoryBatch.count({ where });

    res.json({
      success: true,
      data: batches,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (error) {
    console.error('Get inventory batches error:', error);
    res.status(500).json({
      success: false,
      message: '获取库存批次列表失败'
    });
  }
});

router.get('/batches/:id', authMiddleware, requireRoles('WAREHOUSE_KEEPER', 'ADMIN'), async (req, res) => {
  try {
    const batch = await prisma.inventoryBatch.findUnique({
      where: { id: req.params.id },
      include: {
        drug: true,
        expiryAlerts: true,
        inventoryAudits: {
          orderBy: { createdAt: 'desc' }
        },
        saleItems: {
          include: {
            sale: true
          }
        }
      }
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: '库存批次不存在'
      });
    }

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('Get inventory batch error:', error);
    res.status(500).json({
      success: false,
      message: '获取库存批次详情失败'
    });
  }
});

router.get('/alerts', authMiddleware, requireRoles('WAREHOUSE_KEEPER', 'ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { isRead, alertLevel, page = 1, pageSize = 20 } = req.query;
    
    const where = {};
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (alertLevel) where.alertLevel = parseInt(alertLevel);

    const alerts = await prisma.expiryAlert.findMany({
      where,
      include: {
        inventoryBatch: {
          include: {
            drug: true
          }
        }
      },
      orderBy: { triggeredAt: 'desc' },
      skip: (page - 1) * parseInt(pageSize),
      take: parseInt(pageSize)
    });

    const total = await prisma.expiryAlert.count({ where });

    res.json({
      success: true,
      data: alerts,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (error) {
    console.error('Get expiry alerts error:', error);
    res.status(500).json({
      success: false,
      message: '获取效期预警列表失败'
    });
  }
});

router.post('/alerts/:id/read', authMiddleware, requireRoles('WAREHOUSE_KEEPER', 'ADMIN'), async (req, res) => {
  try {
    const alert = await prisma.expiryAlert.update({
      where: { id: req.params.id },
      data: {
        isRead: true,
        resolvedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Mark alert as read error:', error);
    res.status(500).json({
      success: false,
      message: '标记预警已读失败'
    });
  }
});

router.post('/scan-expiry', authMiddleware, requireRoles('ADMIN', 'WAREHOUSE_KEEPER'), async (req, res) => {
  try {
    const alerts = await FifoExpiryEngine.checkAndCreateAlerts();

    res.json({
      success: true,
      data: {
        scannedAt: new Date(),
        newAlerts: alerts.length,
        alerts
      }
    });
  } catch (error) {
    console.error('Scan expiry error:', error);
    res.status(500).json({
      success: false,
      message: '效期扫描失败'
    });
  }
});

router.post('/adjustment', authMiddleware, requireRoles('WAREHOUSE_KEEPER', 'ADMIN'), async (req, res) => {
  try {
    const { batchId, type, quantity, reason, relatedBizNo } = req.body;

    if (!batchId || !type || !quantity) {
      return res.status(400).json({
        success: false,
        message: '批次、类型和数量不能为空'
      });
    }

    if (!['OVERAGE', 'SHORTAGE'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的调整类型，必须是 OVERAGE 或 SHORTAGE'
      });
    }

    const result = await InventorySettlementEngine.processAdjustment(
      { batchId, type, quantity, reason, relatedBizNo },
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
      data: result
    });
  } catch (error) {
    console.error('Inventory adjustment error:', error);
    res.status(500).json({
      success: false,
      message: '库存调整失败'
    });
  }
});

router.get('/drugs/search', authMiddleware, requireRoles('CASHIER', 'ADMIN', 'PHARMACIST', 'WAREHOUSE_KEEPER'), async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 20 } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请输入搜索关键词'
      });
    }

    const where = {
      OR: [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
        { genericName: { contains: keyword } }
      ]
    };

    const drugs = await prisma.drug.findMany({
      where,
      include: {
        inventoryBatches: {
          where: {
            status: 'IN_STOCK',
            availableQty: { gt: 0 }
          },
          orderBy: [
            { expiryDate: 'asc' }
          ]
        }
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * parseInt(pageSize),
      take: parseInt(pageSize)
    });

    const total = await prisma.drug.count({ where });

    const drugsWithTotalStock = drugs.map(drug => ({
      ...drug,
      totalStock: drug.inventoryBatches.reduce((sum, batch) => sum + batch.availableQty, 0)
    }));

    res.json({
      success: true,
      data: drugsWithTotalStock,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (error) {
    console.error('Search drugs error:', error);
    res.status(500).json({
      success: false,
      message: '搜索药品失败'
    });
  }
});

module.exports = router;
