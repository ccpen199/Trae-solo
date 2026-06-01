const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { auditMiddleware } = require('../middleware/audit');

const router = express.Router();
router.use(auditMiddleware('credit_approvals'));

const creditSchema = Joi.object({
  farmer_id: Joi.number().integer().required(),
  cooperative_id: Joi.number().integer().allow(null),
  crop_cycle: Joi.string().required(),
  product_category: Joi.string().required(),
  requested_amount: Joi.number().min(0).required(),
  approved_amount: Joi.number().min(0).default(0),
  validity_start: Joi.string().required(),
  validity_end: Joi.string().required(),
  risk_tags: Joi.string().allow(''),
  approval_status: Joi.string().valid('pending', 'approved', 'rejected').default('pending'),
  approval_notes: Joi.string().allow('')
});

function calculateCreditScore(farmer) {
  let score = farmer.credit_score || 600;
  
  if (farmer.has_cooperative_guarantee) {
    score += 50;
  }
  
  if (farmer.planting_area >= 50) {
    score += 30;
  }
  
  if (farmer.insurance_info && farmer.insurance_info.length > 0) {
    score += 20;
  }
  
  return Math.min(900, Math.max(300, score));
}

function calculateApprovedAmount(requested, farmer, cooperative) {
  const score = calculateCreditScore(farmer);
  
  let maxRatio = 0.5;
  if (score >= 700) maxRatio = 1.0;
  else if (score >= 600) maxRatio = 0.7;
  else if (score >= 500) maxRatio = 0.3;
  else maxRatio = 0;
  
  if (farmer.has_cooperative_guarantee && cooperative) {
    const availableGuarantee = cooperative.guarantee_limit - cooperative.used_guarantee;
    return Math.min(requested * maxRatio, farmer.guarantee_amount || requested, availableGuarantee);
  }
  
  return requested * maxRatio;
}

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, farmer_id, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '1=1';
  const params = [];
  
  if (farmer_id) {
    whereClause += ' AND ca.farmer_id = ?';
    params.push(farmer_id);
  }
  
  if (status) {
    whereClause += ' AND ca.approval_status = ?';
    params.push(status);
  }
  
  const credits = db.prepare(`
    SELECT ca.*, f.name as farmer_name, c.name as cooperative_name
    FROM credit_approvals ca
    LEFT JOIN farmers f ON ca.farmer_id = f.id
    LEFT JOIN cooperatives c ON ca.cooperative_id = c.id
    WHERE ${whereClause}
    ORDER BY ca.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM credit_approvals ca WHERE ${whereClause}`).get(...params).count;
  
  res.json({ success: true, data: credits, total });
});

router.get('/:id', (req, res) => {
  const credit = db.prepare(`
    SELECT ca.*, f.name as farmer_name, c.name as cooperative_name
    FROM credit_approvals ca
    LEFT JOIN farmers f ON ca.farmer_id = f.id
    LEFT JOIN cooperatives c ON ca.cooperative_id = c.id
    WHERE ca.id = ?
  `).get(req.params.id);
  
  if (!credit) {
    return res.status(404).json({ success: false, message: '授信记录不存在' });
  }
  
  res.json({ success: true, data: credit });
});

router.get('/farmer/:farmerId/available', (req, res) => {
  const credits = db.prepare(`
    SELECT * FROM credit_approvals 
    WHERE farmer_id = ? 
      AND approval_status = 'approved'
      AND available_amount > 0
      AND DATE(validity_end) >= DATE('now')
    ORDER BY id DESC
  `).all(req.params.farmerId);
  
  const totalAvailable = credits.reduce((sum, c) => sum + c.available_amount, 0);
  
  res.json({ success: true, data: credits, totalAvailable });
});

router.post('/calculate', (req, res) => {
  const { farmer_id, requested_amount, cooperative_id } = req.body;
  
  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(farmer_id);
  if (!farmer) {
    return res.status(404).json({ success: false, message: '农户不存在' });
  }
  
  const hasOverdue = db.prepare(`
    SELECT 1 FROM repayments 
    WHERE farmer_id = ? AND is_overdue = 1 AND status != 'paid'
    LIMIT 1
  `).get(farmer_id);
  
  if (hasOverdue) {
    return res.json({ 
      success: true, 
      data: {
        canApprove: false,
        reason: '该农户有逾期未还记录',
        suggested_amount: 0,
        credit_score: calculateCreditScore(farmer)
      }
    });
  }
  
  let cooperative = null;
  if (cooperative_id) {
    cooperative = db.prepare('SELECT * FROM cooperatives WHERE id = ?').get(cooperative_id);
  }
  
  const approvedAmount = calculateApprovedAmount(requested_amount, farmer, cooperative);
  const creditScore = calculateCreditScore(farmer);
  
  res.json({
    success: true,
    data: {
      canApprove: approvedAmount > 0,
      suggested_amount: approvedAmount,
      credit_score: creditScore,
      risk_level: creditScore >= 700 ? '低风险' : creditScore >= 600 ? '中风险' : '高风险'
    }
  });
});

router.post('/', (req, res) => {
  const { error, value } = creditSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(value.farmer_id);
  if (!farmer) {
    return res.status(404).json({ success: false, message: '农户不存在' });
  }
  
  const tx = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO credit_approvals (farmer_id, cooperative_id, crop_cycle, product_category,
        requested_amount, approved_amount, used_amount, available_amount,
        validity_start, validity_end, risk_tags, approval_status, approval_notes)
      VALUES (@farmer_id, @cooperative_id, @crop_cycle, @product_category,
        @requested_amount, @approved_amount, 0, @approved_amount,
        @validity_start, @validity_end, @risk_tags, @approval_status, @approval_notes)
    `);
    
    const result = stmt.run({ ...value, available_amount: value.approved_amount });
    req.audit(result.lastInsertRowid, 'create', null, value);
    
    if (value.approval_status === 'approved' && value.cooperative_id && value.approved_amount > 0) {
      db.prepare(`
        UPDATE cooperatives 
        SET used_guarantee = used_guarantee + ?
        WHERE id = ?
      `).run(value.approved_amount, value.cooperative_id);
    }
    
    return result.lastInsertRowid;
  });
  
  try {
    const id = tx();
    res.json({ success: true, data: { id, ...value } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/approve', (req, res) => {
  const { approved_amount, approval_notes } = req.body;
  
  const credit = db.prepare('SELECT * FROM credit_approvals WHERE id = ?').get(req.params.id);
  if (!credit) {
    return res.status(404).json({ success: false, message: '授信记录不存在' });
  }
  
  if (credit.approval_status !== 'pending') {
    return res.status(400).json({ success: false, message: '该授信已处理' });
  }
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE credit_approvals SET
        approved_amount = ?,
        available_amount = ?,
        approval_status = 'approved',
        approval_notes = ?,
        approved_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(approved_amount, approved_amount, approval_notes, req.params.id);
    
    if (credit.cooperative_id) {
      db.prepare(`
        UPDATE cooperatives 
        SET used_guarantee = used_guarantee + ?
        WHERE id = ?
      `).run(approved_amount, credit.cooperative_id);
    }
    
    req.audit(req.params.id, 'approve', credit, { ...credit, approved_amount, approval_status: 'approved' });
  });
  
  try {
    tx();
    res.json({ success: true, message: '审批通过' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/reject', (req, res) => {
  const { approval_notes } = req.body;
  
  const credit = db.prepare('SELECT * FROM credit_approvals WHERE id = ?').get(req.params.id);
  if (!credit) {
    return res.status(404).json({ success: false, message: '授信记录不存在' });
  }
  
  if (credit.approval_status !== 'pending') {
    return res.status(400).json({ success: false, message: '该授信已处理' });
  }
  
  db.prepare(`
    UPDATE credit_approvals SET
      approval_status = 'rejected',
      approval_notes = ?,
      approved_amount = 0,
      available_amount = 0,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approval_notes, req.params.id);
  
  req.audit(req.params.id, 'reject', credit, { ...credit, approval_status: 'rejected' });
  
  res.json({ success: true, message: '已拒绝' });
});

module.exports = router;
