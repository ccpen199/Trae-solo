const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const db = require('../database');
const config = require('../config');
const AuthMiddleware = require('../middleware/auth');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const autoUnderwriting = require('../engines/autoUnderwriting');
const policyVault = require('../engines/policyVault');

const router = express.Router();

function generatePolicyNumber() {
  const date = dayjs().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return 'POL' + date + random;
}

const getPoliciesByUserIdStmt = db.prepare(`
  SELECT p.*, pr.name as product_name, pr.code as product_code, 
         u.name as policyholder_name, a.name as agent_name
  FROM policies p
  JOIN products pr ON p.product_id = pr.id
  JOIN users u ON p.policyholder_id = u.id
  LEFT JOIN users a ON p.agent_id = a.id
  WHERE p.policyholder_id = ?
  ORDER BY p.created_at DESC
`);

const getPoliciesByAgentStmt = db.prepare(`
  SELECT p.*, pr.name as product_name, pr.code as product_code, 
         u.name as policyholder_name
  FROM policies p
  JOIN products pr ON p.product_id = pr.id
  JOIN users u ON p.policyholder_id = u.id
  WHERE p.agent_id = ?
  ORDER BY p.created_at DESC
`);

const getAllPoliciesStmt = db.prepare(`
  SELECT p.*, pr.name as product_name, pr.code as product_code, 
         u.name as policyholder_name, a.name as agent_name,
         uw.name as underwriter_name
  FROM policies p
  JOIN products pr ON p.product_id = pr.id
  JOIN users u ON p.policyholder_id = u.id
  LEFT JOIN users a ON p.agent_id = a.id
  LEFT JOIN users uw ON p.underwritten_by = uw.id
  ORDER BY p.created_at DESC
`);

const getPendingUnderwritingStmt = db.prepare(`
  SELECT p.*, pr.name as product_name, pr.code as product_code, 
         u.name as policyholder_name, a.name as agent_name
  FROM policies p
  JOIN products pr ON p.product_id = pr.id
  JOIN users u ON p.policyholder_id = u.id
  LEFT JOIN users a ON p.agent_id = a.id
  WHERE p.status = 'pending_approval'
  ORDER BY p.created_at ASC
`);

const getPolicyByIdStmt = db.prepare(`
  SELECT p.*, pr.name as product_name, pr.code as product_code, pr.category as product_category,
         u.name as policyholder_name, u.email as policyholder_email, u.phone as policyholder_phone,
         a.name as agent_name, uw.name as underwriter_name
  FROM policies p
  JOIN products pr ON p.product_id = pr.id
  JOIN users u ON p.policyholder_id = u.id
  LEFT JOIN users a ON p.agent_id = a.id
  LEFT JOIN users uw ON p.underwritten_by = uw.id
  WHERE p.id = ?
`);

const insertPolicyStmt = db.prepare(`
  INSERT INTO policies 
  (id, policy_number, product_id, policyholder_id, agent_id, 
   premium_amount, sum_assured, start_date, end_date, status,
   health_declaration, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, datetime('now'), datetime('now'))
`);

const updatePolicyStatusStmt = db.prepare(`
  UPDATE policies SET
    status = ?, risk_score = ?, underwriting_result = ?, 
    underwritten_at = datetime('now'), underwritten_by = ?, updated_at = datetime('now')
  WHERE id = ?
`);

const activatePolicyStmt = db.prepare(`
  UPDATE policies SET status = 'active', updated_at = datetime('now')
  WHERE id = ?
`);

router.get('/', AuthMiddleware.authenticate, (req, res) => {
  try {
    let policies;
    
    if (req.user.role === config.roles.POLICYHOLDER) {
      policies = getPoliciesByUserIdStmt.all(req.user.id);
    } else if (req.user.role === config.roles.AGENT) {
      policies = getPoliciesByAgentStmt.all(req.user.id);
    } else if (req.user.role === config.roles.UNDERWRITER) {
      policies = getAllPoliciesStmt.all();
    } else {
      policies = getAllPoliciesStmt.all();
    }
    
    res.json({ policies });
  } catch (err) {
    console.error('Get policies error:', err);
    res.status(500).json({ error: '获取保单列表失败' });
  }
});

router.get('/pending-underwriting', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.UNDERWRITER, config.roles.ADMIN), (req, res) => {
  try {
    const policies = getPendingUnderwritingStmt.all();
    res.json({ policies });
  } catch (err) {
    console.error('Get pending underwriting error:', err);
    res.status(500).json({ error: '获取待核保单列表失败' });
  }
});

router.get('/:policyId', AuthMiddleware.authenticate, (req, res) => {
  try {
    const policy = getPolicyByIdStmt.get(req.params.policyId);
    
    if (!policy) {
      return res.status(404).json({ error: '保单不存在' });
    }
    
    if (req.user.role === config.roles.POLICYHOLDER && policy.policyholder_id !== req.user.id) {
      return res.status(403).json({ error: '无权访问此保单' });
    }
    if (req.user.role === config.roles.AGENT && policy.agent_id !== req.user.id) {
      return res.status(403).json({ error: '无权访问此保单' });
    }
    
    const auditLogs = AuditService.getByEntity('policy', req.params.policyId);
    const vaultTrail = policyVault.getAuditTrail('policy', req.params.policyId);
    
    res.json({
      policy: {
        ...policy,
        health_declaration: policy.health_declaration ? JSON.parse(policy.health_declaration) : null,
        underwriting_result: policy.underwriting_result ? JSON.parse(policy.underwriting_result) : null
      },
      auditLogs,
      vaultTrail
    });
  } catch (err) {
    console.error('Get policy error:', err);
    res.status(500).json({ error: '获取保单详情失败' });
  }
});

router.post('/', AuthMiddleware.authenticate, AuthMiddleware.requirePolicyholderOrAgent, (req, res) => {
  try {
    const { product_id, policyholder_id, agent_id, premium_amount, sum_assured, start_date, end_date, health_declaration } = req.body;
    
    if (!product_id || !premium_amount || !sum_assured || !start_date || !end_date) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    let actualPolicyholderId = policyholder_id;
    let actualAgentId = agent_id;
    
    if (req.user.role === config.roles.POLICYHOLDER) {
      actualPolicyholderId = req.user.id;
      actualAgentId = null;
    }
    
    if (req.user.role === config.roles.AGENT) {
      actualAgentId = req.user.id;
      if (!actualPolicyholderId) {
        return res.status(400).json({ error: '请指定投保人' });
      }
    }
    
    const id = uuidv4();
    const policyNumber = generatePolicyNumber();
    
    insertPolicyStmt.run(
      id,
      policyNumber,
      product_id,
      actualPolicyholderId,
      actualAgentId,
      premium_amount,
      sum_assured,
      start_date,
      end_date,
      health_declaration ? JSON.stringify(health_declaration) : null
    );
    
    AuditService.log('policy', id, 'create', req.user.id, req.user.role, {
      product_id,
      policyNumber,
      premium_amount,
      sum_assured
    }, 'success');
    
    res.json({
      policy: {
        id,
        policy_number: policyNumber,
        status: 'draft'
      },
      message: '投保申请已创建，等待提交核保'
    });
  } catch (err) {
    console.error('Create policy error:', err);
    res.status(500).json({ error: '创建投保申请失败' });
  }
});

router.post('/:policyId/submit', AuthMiddleware.authenticate, (req, res) => {
  try {
    const policy = getPolicyByIdStmt.get(req.params.policyId);
    
    if (!policy) {
      return res.status(404).json({ error: '保单不存在' });
    }
    
    if (req.user.role === config.roles.POLICYHOLDER && policy.policyholder_id !== req.user.id) {
      return res.status(403).json({ error: '无权操作此保单' });
    }
    if (req.user.role === config.roles.AGENT && policy.agent_id !== req.user.id) {
      return res.status(403).json({ error: '无权操作此保单' });
    }
    
    if (policy.status !== 'draft') {
      return res.status(400).json({ error: '只能提交草稿状态的保单' });
    }
    
    if (!policy.health_declaration) {
      return res.status(400).json({ error: '请先完成健康告知' });
    }
    
    const healthDec = JSON.parse(policy.health_declaration);
    const underwritingResult = autoUnderwriting.evaluateHealthDeclaration({
      ...healthDec,
      sumAssured: policy.sum_assured
    });
    
    const newStatus = underwritingResult.decision === 'approve' ? 'pending_approval' : 'pending_approval';
    
    updatePolicyStatusStmt.run(
      newStatus,
      underwritingResult.totalRisk,
      JSON.stringify(underwritingResult),
      null,
      req.params.policyId
    );
    
    policyVault.storeRecord('policy', req.params.policyId, 'submitted', policy, {
      action: 'submit_for_underwriting',
      underwritingResult: underwritingResult.decision
    });
    
    AuditService.log('policy', req.params.policyId, 'submit_for_underwriting', req.user.id, req.user.role, {
      underwritingDecision: underwritingResult.decision,
      riskScore: underwritingResult.totalRisk
    }, 'success');
    
    if (underwritingResult.decision === 'approve') {
      NotificationService.broadcastToRole(
        config.roles.UNDERWRITER,
        '自动核保通过待确认',
        '保单 ' + policy.policy_number + ' 自动核保通过，等待最终确认',
        'underwriting',
        'policy',
        req.params.policyId
      );
      
      res.json({
        message: '投保申请已提交，智能核保通过，等待确认',
        underwritingResult: {
          decision: underwritingResult.decision,
          decisionReason: underwritingResult.decisionReason,
          riskScore: underwritingResult.totalRisk
        }
      });
    } else if (underwritingResult.decision === 'reject') {
      res.json({
        message: '投保申请已提交，智能核保建议拒保',
        underwritingResult: {
          decision: underwritingResult.decision,
          decisionReason: underwritingResult.decisionReason,
          riskScore: underwritingResult.totalRisk
        }
      });
    } else {
      NotificationService.broadcastToRole(
        config.roles.UNDERWRITER,
        '新保单待人工核保',
        '保单 ' + policy.policy_number + ' 需要人工核保，请及时处理',
        'underwriting',
        'policy',
        req.params.policyId
      );
      
      res.json({
        message: '投保申请已提交，等待人工核保',
        underwritingResult: {
          decision: underwritingResult.decision,
          decisionReason: underwritingResult.decisionReason,
          riskScore: underwritingResult.totalRisk
        }
      });
    }
  } catch (err) {
    console.error('Submit policy error:', err);
    res.status(500).json({ error: '提交投保申请失败' });
  }
});

router.post('/:policyId/underwrite', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.UNDERWRITER, config.roles.ADMIN), (req, res) => {
  try {
    const { decision, reason } = req.body;
    
    if (!decision || !['approve', 'reject', 'manual'].includes(decision)) {
      return res.status(400).json({ error: '请指定有效的核保决定' });
    }
    
    const policy = getPolicyByIdStmt.get(req.params.policyId);
    
    if (!policy) {
      return res.status(404).json({ error: '保单不存在' });
    }
    
    if (policy.status !== 'pending_approval') {
      return res.status(400).json({ error: '保单不在待核保状态' });
    }
    
    let newStatus;
    if (decision === 'approve') {
      newStatus = 'approved';
    } else if (decision === 'reject') {
      newStatus = 'rejected';
    } else {
      newStatus = 'pending_approval';
    }
    
    const updateStmt = db.prepare(`
      UPDATE policies SET
        status = ?, underwritten_at = datetime('now'), underwritten_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    
    updateStmt.run(newStatus, req.user.id, req.params.policyId);
    
    policyVault.storeRecord('policy', req.params.policyId, 'underwritten', policy, {
      decision,
      reason,
      underwriterId: req.user.id
    });
    
    AuditService.log('policy', req.params.policyId, 'underwrite_' + decision, req.user.id, req.user.role, {
      reason
    }, 'success');
    
    if (decision === 'approve') {
      activatePolicyStmt.run(req.params.policyId);
      
      NotificationService.create(
        policy.policyholder_id,
        '保单已生效',
        '恭喜！您的保单 ' + policy.policy_number + ' 已通过核保并生效',
        'info',
        'policy',
        req.params.policyId
      );
      
      res.json({ message: '核保通过，保单已生效' });
    } else if (decision === 'reject') {
      NotificationService.create(
        policy.policyholder_id,
        '投保申请未通过',
        '很抱歉，您的投保申请 ' + policy.policy_number + ' 未通过核保，原因：' + reason,
        'warning',
        'policy',
        req.params.policyId
      );
      
      res.json({ message: '核保不通过' });
    } else {
      res.json({ message: '已标记为人工核保' });
    }
  } catch (err) {
    console.error('Underwrite policy error:', err);
    res.status(500).json({ error: '核保处理失败' });
  }
});

module.exports = router;
