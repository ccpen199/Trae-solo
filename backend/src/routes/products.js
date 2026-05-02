const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const config = require('../config');
const AuthMiddleware = require('../middleware/auth');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const actuarialEngine = require('../engines/actuarialPricing');
const policyVault = require('../engines/policyVault');

const router = express.Router();

const getAllApprovedProductsStmt = db.prepare(`
  SELECT p.*, u.name as creator_name
  FROM products p
  LEFT JOIN users u ON p.created_by = u.id
  WHERE p.status = 'approved'
  ORDER BY p.created_at DESC
`);

const getAllProductsStmt = db.prepare(`
  SELECT p.*, u.name as creator_name, a.name as approver_name
  FROM products p
  LEFT JOIN users u ON p.created_by = u.id
  LEFT JOIN users a ON p.approved_by = a.id
  ORDER BY p.created_at DESC
`);

const getProductByIdStmt = db.prepare(`
  SELECT p.*, u.name as creator_name, a.name as approver_name
  FROM products p
  LEFT JOIN users u ON p.created_by = u.id
  LEFT JOIN users a ON p.approved_by = a.id
  WHERE p.id = ?
`);

const insertProductStmt = db.prepare(`
  INSERT INTO products 
  (id, name, code, description, category, base_premium, risk_factors, status,
   coverage_details, exclusions, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, datetime('now'), datetime('now'))
`);

const updateProductStmt = db.prepare(`
  UPDATE products SET
    name = ?, code = ?, description = ?, category = ?, 
    base_premium = ?, risk_factors = ?, coverage_details = ?, 
    exclusions = ?, updated_at = datetime('now')
  WHERE id = ? AND status = 'draft'
`);

const updateProductStatusStmt = db.prepare(`
  UPDATE products SET
    status = ?, approved_by = ?, updated_at = datetime('now')
  WHERE id = ?
`);

router.get('/', AuthMiddleware.authenticate, (req, res) => {
  try {
    let products;
    
    if (req.user.role === config.roles.AGENT || req.user.role === config.roles.POLICYHOLDER) {
      products = getAllApprovedProductsStmt.all();
    } else {
      products = getAllProductsStmt.all();
    }
    
    const result = products.map(p => ({
      ...p,
      risk_factors: p.risk_factors ? JSON.parse(p.risk_factors) : null,
      coverage_details: p.coverage_details ? JSON.parse(p.coverage_details) : null,
      exclusions: p.exclusions ? JSON.parse(p.exclusions) : null
    }));
    
    res.json({ products: result });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: '获取产品列表失败' });
  }
});

router.get('/:productId', AuthMiddleware.authenticate, (req, res) => {
  try {
    const product = getProductByIdStmt.get(req.params.productId);
    
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }
    
    if (product.status !== 'approved' && 
        req.user.role !== config.roles.ADMIN && 
        req.user.role !== config.roles.UNDERWRITER) {
      return res.status(403).json({ error: '无权访问此产品' });
    }
    
    res.json({
      product: {
        ...product,
        risk_factors: product.risk_factors ? JSON.parse(product.risk_factors) : null,
        coverage_details: product.coverage_details ? JSON.parse(product.coverage_details) : null,
        exclusions: product.exclusions ? JSON.parse(product.exclusions) : null
      }
    });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: '获取产品详情失败' });
  }
});

router.post('/calculate-premium', AuthMiddleware.authenticate, (req, res) => {
  try {
    const { productId, sumAssured, riskFactors, termMonths } = req.body;
    
    const product = getProductByIdStmt.get(productId);
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }
    
    const result = actuarialEngine.calculatePremium(
      product.category,
      sumAssured,
      riskFactors,
      termMonths
    );
    
    res.json({
      premium: result,
      product: {
        id: product.id,
        name: product.name,
        code: product.code
      }
    });
  } catch (err) {
    console.error('Calculate premium error:', err);
    res.status(500).json({ error: '计算保费失败' });
  }
});

router.post('/', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.AGENT, config.roles.ADMIN), (req, res) => {
  try {
    const { name, code, description, category, base_premium, risk_factors, coverage_details, exclusions } = req.body;
    
    if (!name || !code || !category) {
      return res.status(400).json({ error: '产品名称、代码和分类为必填项' });
    }
    
    const validation = actuarialEngine.validateProductConfig({
      name, code, category, base_premium
    });
    
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }
    
    const id = uuidv4();
    insertProductStmt.run(
      id,
      name,
      code,
      description || '',
      category,
      base_premium || 0,
      risk_factors ? JSON.stringify(risk_factors) : null,
      coverage_details ? JSON.stringify(coverage_details) : null,
      exclusions ? JSON.stringify(exclusions) : null,
      req.user.id
    );
    
    AuditService.log('product', id, 'create', req.user.id, req.user.role, {
      name, code, category
    }, 'success');
    
    res.json({
      product: {
        id,
        name,
        code,
        category,
        status: 'draft'
      },
      message: '产品已创建，等待上架审批'
    });
  } catch (err) {
    console.error('Create product error:', err);
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: '产品代码已存在' });
    }
    res.status(500).json({ error: '创建产品失败' });
  }
});

router.put('/:productId', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.AGENT, config.roles.ADMIN), (req, res) => {
  try {
    const product = getProductByIdStmt.get(req.params.productId);
    
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }
    
    if (product.status !== 'draft') {
      return res.status(400).json({ error: '只能编辑草稿状态的产品' });
    }
    
    if (req.user.role !== config.roles.ADMIN && product.created_by !== req.user.id) {
      return res.status(403).json({ error: '无权编辑此产品' });
    }
    
    const { name, code, description, category, base_premium, risk_factors, coverage_details, exclusions } = req.body;
    
    updateProductStmt.run(
      name || product.name,
      code || product.code,
      description !== undefined ? description : product.description,
      category || product.category,
      base_premium !== undefined ? base_premium : product.base_premium,
      risk_factors ? JSON.stringify(risk_factors) : product.risk_factors,
      coverage_details ? JSON.stringify(coverage_details) : product.coverage_details,
      exclusions ? JSON.stringify(exclusions) : product.exclusions,
      req.params.productId
    );
    
    AuditService.log('product', req.params.productId, 'update', req.user.id, req.user.role, {}, 'success');
    
    res.json({ message: '产品已更新' });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: '更新产品失败' });
  }
});

router.post('/:productId/submit', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.AGENT, config.roles.ADMIN), (req, res) => {
  try {
    const product = getProductByIdStmt.get(req.params.productId);
    
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }
    
    if (product.status !== 'draft') {
      return res.status(400).json({ error: '产品已提交或已上架' });
    }
    
    updateProductStatusStmt.run('pending_approval', null, req.params.productId);
    
    AuditService.log('product', req.params.productId, 'submit_for_approval', req.user.id, req.user.role, {}, 'success');
    
    NotificationService.broadcastToRole(
      config.roles.UNDERWRITER,
      '新产品待审批',
      '产品 "' + product.name + '" 已提交审批，请及时处理',
      'approval',
      'product',
      req.params.productId
    );
    
    res.json({ message: '产品已提交审批' });
  } catch (err) {
    console.error('Submit product error:', err);
    res.status(500).json({ error: '提交产品失败' });
  }
});

router.post('/:productId/approve', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.UNDERWRITER, config.roles.ADMIN), (req, res) => {
  try {
    const product = getProductByIdStmt.get(req.params.productId);
    
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }
    
    if (product.status !== 'pending_approval') {
      return res.status(400).json({ error: '产品不在待审批状态' });
    }
    
    updateProductStatusStmt.run('approved', req.user.id, req.params.productId);
    
    policyVault.storeRecord('product', req.params.productId, 'approved', product, {
      approvedBy: req.user.id,
      action: 'approve_product'
    });
    
    AuditService.log('product', req.params.productId, 'approve', req.user.id, req.user.role, {}, 'success');
    
    if (product.created_by) {
      NotificationService.create(
        product.created_by,
        '产品已上架',
        `您的产品 "${product.name}" 已通过审批并成功上架`,
        'info',
        'product',
        req.params.productId
      );
    }
    
    res.json({ message: '产品已上架' });
  } catch (err) {
    console.error('Approve product error:', err);
    res.status(500).json({ error: '审批产品失败' });
  }
});

module.exports = router;
