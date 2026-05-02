const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const auditService = require('../services/audit.service');
const trustLinkService = require('../services/trust-link.service');
const imageOCRService = require('../services/image-ocr.service');

router.get('/dashboard', authenticateToken, requireRole('admin', 'customer_service'), (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE status = ?').get('on_sale').count;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const totalRevenue = db.prepare('SELECT SUM(price) as total FROM orders WHERE status = ?').get('completed').total || 0;

  const pendingReviews = db.prepare('SELECT COUNT(*) as count FROM products WHERE status = ?').get('pending_review').count;
  const pendingDisputes = db.prepare('SELECT COUNT(*) as count FROM disputes WHERE status = ?').get('pending').count;
  const activeOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status NOT IN (?, ?)').get('completed', 'cancelled').count;

  const recentOrders = db.prepare(`
    SELECT 
      o.*,
      p.title as product_title,
      buyer.nickname as buyer_nickname
    FROM orders o
    JOIN products p ON o.product_id = p.id
    LEFT JOIN users buyer ON o.buyer_id = buyer.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `).all();

  const recentDisputes = db.prepare(`
    SELECT 
      d.*,
      o.order_no,
      initiator.nickname as initiator_nickname
    FROM disputes d
    JOIN orders o ON d.order_id = o.id
    LEFT JOIN users initiator ON d.initiator_id = initiator.id
    ORDER BY d.created_at DESC
    LIMIT 10
  `).all();

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingReviews,
        pendingDisputes,
        activeOrders
      },
      recentOrders,
      recentDisputes
    }
  });
});

router.get('/products/review', authenticateToken, requireRole('admin', 'customer_service'), (req, res) => {
  const { status = 'pending_review', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const countSql = `SELECT COUNT(*) as total FROM products WHERE status = ?`;
  const countResult = db.prepare(countSql).get(status);
  const total = countResult.total;

  const sql = `
    SELECT 
      p.*,
      u.nickname as seller_nickname,
      u.trust_score as seller_trust_score
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.status = ?
    ORDER BY p.created_at ASC
    LIMIT ? OFFSET ?
  `;

  const products = db.prepare(sql).all(status, parseInt(limit), offset);

  const formattedProducts = products.map(p => ({
    ...p,
    images: p.images ? JSON.parse(p.images) : [],
    ocrResult: p.ocr_result ? JSON.parse(p.ocr_result) : null
  }));

  res.json({
    success: true,
    data: {
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

router.post('/products/:id/approve', authenticateToken, requireRole('admin', 'customer_service'), (req, res) => {
  const productId = req.params.id;
  const userId = req.user.id;
  const { comment } = req.body;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: '商品不存在'
    });
  }

  if (product.status !== 'pending_review') {
    return res.status(400).json({
      success: false,
      message: '商品状态不支持审核'
    });
  }

  db.prepare(`
    UPDATE products 
    SET status = ?, reviewer_id = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run('on_sale', userId, comment || null, productId);

  trustLinkService.onProductApproved(product.seller_id, productId, req.user);

  const updatedProduct = db.prepare(`
    SELECT 
      p.*,
      u.nickname as seller_nickname
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.id = ?
  `).get(productId);

  auditService.logStatusChange({
    user: req.user,
    module: auditService.MODULES.PRODUCT,
    resourceType: 'product',
    resourceId: productId,
    oldValue: { status: 'pending_review' },
    newValue: { status: 'on_sale' },
    description: `审核通过商品: ${product.title}`
  });

  res.json({
    success: true,
    message: '商品审核通过，已上架',
    data: {
      ...updatedProduct,
      images: updatedProduct.images ? JSON.parse(updatedProduct.images) : []
    }
  });
});

router.post('/products/:id/reject', authenticateToken, requireRole('admin', 'customer_service'), (req, res) => {
  const productId = req.params.id;
  const userId = req.user.id;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: '请提供拒绝原因'
    });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: '商品不存在'
    });
  }

  if (product.status !== 'pending_review') {
    return res.status(400).json({
      success: false,
      message: '商品状态不支持审核'
    });
  }

  db.prepare(`
    UPDATE products 
    SET status = ?, reviewer_id = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run('rejected', userId, reason, productId);

  trustLinkService.onProductRejected(product.seller_id, productId, req.user);

  auditService.logStatusChange({
    user: req.user,
    module: auditService.MODULES.PRODUCT,
    resourceType: 'product',
    resourceId: productId,
    oldValue: { status: 'pending_review' },
    newValue: { status: 'rejected' },
    description: `审核拒绝商品: ${product.title}, 原因: ${reason}`
  });

  res.json({
    success: true,
    message: '商品审核拒绝'
  });
});

router.get('/users', authenticateToken, requireRole('admin'), (req, res) => {
  const { role, status, keyword, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let whereConditions = ['1=1'];
  let whereParams = [];

  if (role) {
    whereConditions.push('role = ?');
    whereParams.push(role);
  }

  if (status) {
    whereConditions.push('status = ?');
    whereParams.push(status);
  }

  if (keyword) {
    whereConditions.push('(username LIKE ? OR nickname LIKE ? OR phone LIKE ?)');
    const keywordPattern = `%${keyword}%`;
    whereParams.push(keywordPattern, keywordPattern, keywordPattern);
  }

  const whereClause = whereConditions.join(' AND ');

  const countSql = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
  const countResult = db.prepare(countSql).get(...whereParams);
  const total = countResult.total;

  const sql = `
    SELECT 
      id, username, nickname, avatar, phone, email, 
      role, trust_score, trust_level, is_verified, status,
      created_at, updated_at
    FROM users 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  const users = db.prepare(sql).all(...whereParams, parseInt(limit), offset);

  res.json({
    success: true,
    data: {
      users: users.map(u => ({
        ...u,
        isVerified: u.is_verified === 1
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

router.put('/users/:id/status', authenticateToken, requireRole('admin'), (req, res) => {
  const userId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['active', 'banned', 'frozen'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: '无效的用户状态'
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  db.prepare(`
    UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, userId);

  auditService.logStatusChange({
    user: req.user,
    module: auditService.MODULES.USER,
    resourceType: 'user',
    resourceId: userId,
    oldValue: { status: user.status },
    newValue: { status },
    description: `更新用户状态: ${user.username} -> ${status}`
  });

  res.json({
    success: true,
    message: '用户状态已更新'
  });
});

router.get('/audit-logs', authenticateToken, requireRole('admin'), (req, res) => {
  const { module, action, userId, keyword, startDate, endDate, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const logs = auditService.searchLogs({
    module,
    action,
    userId: userId ? parseInt(userId) : null,
    keyword,
    startDate,
    endDate,
    limit: parseInt(limit),
    offset
  });

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    }
  });
});

router.get('/trust/:userId', authenticateToken, requireRole('admin', 'customer_service'), (req, res) => {
  const userId = req.params.userId;

  const stats = trustLinkService.getTrustStats(userId);
  const history = trustLinkService.getUserTrustHistory(userId, 50);

  if (!stats) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  res.json({
    success: true,
    data: {
      stats,
      history
    }
  });
});

router.get('/categories', authenticateToken, requireRole('admin', 'customer_service'), (req, res) => {
  const categories = imageOCRService.getAllCategories();
  
  const categoryStats = db.prepare(`
    SELECT category, COUNT(*) as count, AVG(price) as avg_price
    FROM products
    WHERE status = 'on_sale'
    GROUP BY category
  `).all();

  const statsMap = {};
  categoryStats.forEach(s => {
    statsMap[s.category] = { count: s.count, avgPrice: s.avg_price };
  });

  const result = categories.map(cat => ({
    name: cat,
    ...(statsMap[cat] || { count: 0, avgPrice: 0 })
  }));

  res.json({
    success: true,
    data: result
  });
});

router.get('/brands', authenticateToken, requireRole('admin', 'customer_service'), (req, res) => {
  const brands = imageOCRService.getAllBrands();

  res.json({
    success: true,
    data: brands
  });
});

module.exports = router;
