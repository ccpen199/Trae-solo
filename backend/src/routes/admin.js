const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole, sensitiveOperation } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [totalUsers, totalEnterprises, totalProducts, totalOrders] = await Promise.all([
      prisma.user.count(),
      prisma.enterprise.count(),
      prisma.welfareProduct.count(),
      prisma.welfareOrder.count(),
    ]);

    const recentOrders = await prisma.welfareOrder.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true, product: true },
    });

    const activeUsers = await prisma.user.count({
      where: {
        auditLogs: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    res.json({
      stats: {
        totalUsers,
        totalEnterprises,
        totalProducts,
        totalOrders,
        activeUsers,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/audit-logs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, pageSize = 20, action, userId } = req.query;

    const where = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const actions = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: true,
    });

    res.json({
      logs,
      actions: actions.map(a => ({ name: a.action, count: a._count })),
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: '获取审计日志失败' });
  }
});

router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, pageSize = 20, role } = req.query;

    const where = {};
    if (role) where.role = role;

    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        include: { enterprise: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

router.post('/policies', authenticateToken, requireRole(['admin']), sensitiveOperation, auditLog('POLICY_CREATE', 'admin'), async (req, res) => {
  try {
    const {
      cityCode,
      cityName,
      pensionRates,
      medicalRates,
      unemploymentRates,
      injuryRates,
      maternityRates,
      housingFundRates,
      minBase,
      maxBase,
      effectiveDate,
    } = req.body;

    const policy = await prisma.socialSecurityPolicy.upsert({
      where: { cityCode },
      update: {
        cityName,
        pensionRates: JSON.stringify(pensionRates),
        medicalRates: JSON.stringify(medicalRates),
        unemploymentRates: JSON.stringify(unemploymentRates),
        injuryRates: JSON.stringify(injuryRates),
        maternityRates: JSON.stringify(maternityRates),
        housingFundRates: JSON.stringify(housingFundRates),
        minBase,
        maxBase,
        effectiveDate: new Date(effectiveDate),
      },
      create: {
        cityCode,
        cityName,
        pensionRates: JSON.stringify(pensionRates),
        medicalRates: JSON.stringify(medicalRates),
        unemploymentRates: JSON.stringify(unemploymentRates),
        injuryRates: JSON.stringify(injuryRates),
        maternityRates: JSON.stringify(maternityRates),
        housingFundRates: JSON.stringify(housingFundRates),
        minBase,
        maxBase,
        effectiveDate: new Date(effectiveDate),
      },
    });

    res.json(policy);
  } catch (error) {
    console.error('Create policy error:', error);
    res.status(500).json({ error: '创建政策失败' });
  }
});

router.post('/products', authenticateToken, requireRole(['admin']), sensitiveOperation, auditLog('PRODUCT_CREATE', 'admin'), async (req, res) => {
  try {
    const { name, description, price, category, targetAudienceRules, validityDays, autoExpire, stock } = req.body;

    const product = await prisma.welfareProduct.create({
      data: {
        name,
        description,
        price,
        category,
        targetAudienceRules: JSON.stringify(targetAudienceRules),
        validityDays,
        autoExpire,
        stock,
      },
    });

    res.json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: '创建商品失败' });
  }
});

router.put('/products/:id', authenticateToken, requireRole(['admin']), sensitiveOperation, auditLog('PRODUCT_UPDATE', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, targetAudienceRules, validityDays, autoExpire, stock } = req.body;

    const product = await prisma.welfareProduct.update({
      where: { id },
      data: {
        name,
        description,
        price,
        category,
        targetAudienceRules: targetAudienceRules ? JSON.stringify(targetAudienceRules) : undefined,
        validityDays,
        autoExpire,
        stock,
      },
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: '更新商品失败' });
  }
});

router.get('/audience-rules', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const products = await prisma.welfareProduct.findMany({
      where: { targetAudienceRules: { not: null } },
      select: {
        id: true,
        name: true,
        category: true,
        targetAudienceRules: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const rules = products.map(p => ({
      id: p.id,
      productName: p.name,
      category: p.category,
      rules: p.targetAudienceRules ? JSON.parse(p.targetAudienceRules) : null,
      createdAt: p.createdAt,
    }));

    res.json({ rules, total: rules.length });
  } catch (error) {
    console.error('Get audience rules error:', error);
    res.status(500).json({ error: '获取人群圈选规则失败' });
  }
});

router.get('/audience-preview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { productId } = req.query;
    const product = await prisma.welfareProduct.findUnique({
      where: { id: productId },
      select: { targetAudienceRules: true },
    });

    if (!product || !product.targetAudienceRules) {
      return res.json({ users: [], count: 0 });
    }

    const rules = JSON.parse(product.targetAudienceRules);
    const where = {};

    if (rules.roles && rules.roles.length > 0) {
      where.role = { in: rules.roles };
    }
    if (rules.minAge) {
      where.age = { gte: rules.minAge };
    }
    if (rules.maxAge) {
      where.age = { lte: rules.maxAge };
    }
    if (rules.cities && rules.cities.length > 0) {
      where.city = { in: rules.cities };
    }
    if (rules.enterpriseIds && rules.enterpriseIds.length > 0) {
      where.enterpriseId = { in: rules.enterpriseIds };
    }

    const users = await prisma.user.findMany({
      where,
      take: 50,
      select: { id: true, name: true, email: true, role: true, city: true },
    });

    const count = await prisma.user.count({ where });

    res.json({ users, count });
  } catch (error) {
    console.error('Get audience preview error:', error);
    res.status(500).json({ error: '获取人群预览失败' });
  }
});

router.get('/redemption-codes', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, productId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (productId) where.productId = productId;

    const skip = (page - 1) * pageSize;

    const [codes, total] = await Promise.all([
      prisma.redemptionCode.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        include: { user: true, product: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.redemptionCode.count({ where }),
    ]);

    const stats = await prisma.redemptionCode.groupBy({
      by: ['status'],
      _count: true,
    });

    res.json({
      codes,
      stats: stats.map(s => ({ status: s.status, count: s._count })),
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get redemption codes error:', error);
    res.status(500).json({ error: '获取核销码列表失败' });
  }
});

router.post('/redemption-codes/:code/redeem', authenticateToken, requireRole(['admin']), sensitiveOperation, auditLog('CODE_REDEEM_ADMIN', 'admin'), async (req, res) => {
  try {
    const { code } = req.params;

    const redemptionCode = await prisma.redemptionCode.findUnique({
      where: { code },
      include: { product: true },
    });

    if (!redemptionCode) {
      return res.status(404).json({ error: '核销码不存在' });
    }

    if (redemptionCode.status === 'used') {
      return res.status(400).json({ error: '核销码已使用' });
    }

    if (redemptionCode.status === 'expired') {
      return res.status(400).json({ error: '核销码已过期' });
    }

    const updated = await prisma.redemptionCode.update({
      where: { code },
      data: {
        status: 'used',
        redeemedAt: new Date(),
      },
    });

    res.json({ success: true, code: updated });
  } catch (error) {
    console.error('Admin redeem code error:', error);
    res.status(500).json({ error: '核销失败' });
  }
});

router.get('/expiring-items', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + parseInt(days));

    const expiringCodes = await prisma.redemptionCode.findMany({
      where: {
        status: 'active',
        expiresAt: { lte: cutoffDate },
      },
      include: { user: true, product: true },
      orderBy: { expiresAt: 'asc' },
      take: 100,
    });

    const expiredProducts = await prisma.welfareProduct.findMany({
      where: {
        autoExpire: true,
        expiresAt: { lte: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
    });

    const stats = {
      expiringCodesCount: expiringCodes.length,
      expiredProductsCount: expiredProducts.length,
      totalValue: expiringCodes.reduce((sum, c) => sum + (c.product?.price || 0), 0),
    };

    res.json({ expiringCodes, expiredProducts, stats });
  } catch (error) {
    console.error('Get expiring items error:', error);
    res.status(500).json({ error: '获取即将过期数据失败' });
  }
});

router.post('/expire-batch', authenticateToken, requireRole(['admin']), sensitiveOperation, auditLog('EXPIRE_BATCH', 'admin'), async (req, res) => {
  try {
    const { type, ids } = req.body;

    let updated = 0;

    if (type === 'codes') {
      const result = await prisma.redemptionCode.updateMany({
        where: { id: { in: ids }, status: 'active' },
        data: { status: 'expired' },
      });
      updated = result.count;
    } else if (type === 'products') {
      const result = await prisma.welfareProduct.updateMany({
        where: { id: { in: ids } },
        data: { status: 'inactive' },
      });
      updated = result.count;
    }

    res.json({ success: true, updated });
  } catch (error) {
    console.error('Batch expire error:', error);
    res.status(500).json({ error: '批量过期处理失败' });
  }
});

router.get('/audit-reviews', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, pageSize = 20, reviewed } = req.query;

    const where = {};
    if (reviewed !== undefined) where.reviewed = reviewed === 'true';

    const skip = (page - 1) * pageSize;

    const [reviews, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          ...where,
          OR: [
            { action: { contains: 'SENSITIVE' } },
            { action: { contains: 'ADMIN' } },
            { secondVerified: true },
          ],
        },
        skip,
        take: parseInt(pageSize),
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({
        where: {
          ...where,
          OR: [
            { action: { contains: 'SENSITIVE' } },
            { action: { contains: 'ADMIN' } },
            { secondVerified: true },
          ],
        },
      }),
    ]);

    const pendingCount = await prisma.auditLog.count({
      where: {
        reviewed: false,
        OR: [
          { action: { contains: 'SENSITIVE' } },
          { action: { contains: 'ADMIN' } },
          { secondVerified: true },
        ],
      },
    });

    res.json({
      reviews,
      pendingCount,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get audit reviews error:', error);
    res.status(500).json({ error: '获取审计复查列表失败' });
  }
});

router.put('/audit-reviews/:id/review', authenticateToken, requireRole(['admin']), sensitiveOperation, auditLog('AUDIT_REVIEW', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNote, reviewResult } = req.body;

    const updated = await prisma.auditLog.update({
      where: { id },
      data: {
        reviewed: true,
        reviewedAt: new Date(),
        detail: JSON.stringify({
          reviewNote,
          reviewResult,
          reviewedBy: req.user.id,
        }),
      },
    });

    res.json({ success: true, log: updated });
  } catch (error) {
    console.error('Review audit error:', error);
    res.status(500).json({ error: '审计复查处理失败' });
  }
});

module.exports = router;
