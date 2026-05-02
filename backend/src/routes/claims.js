const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const db = require('../database');
const config = require('../config');
const AuthMiddleware = require('../middleware/auth');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const claimAudit = require('../engines/claimAudit');
const policyVault = require('../engines/policyVault');

const router = express.Router();

function generateClaimNumber() {
  const date = dayjs().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return 'CLM' + date + random;
}

const getClaimsByUserStmt = db.prepare(`
  SELECT c.*, p.policy_number, pr.name as product_name,
         u.name as claimant_name
  FROM claims c
  JOIN policies p ON c.policy_id = p.id
  JOIN products pr ON p.product_id = pr.id
  JOIN users u ON c.claimant_id = u.id
  WHERE c.claimant_id = ?
  ORDER BY c.created_at DESC
`);

const getAllClaimsStmt = db.prepare(`
  SELECT c.*, p.policy_number, pr.name as product_name,
         u.name as claimant_name, a.name as assigned_name,
         es.name as escalated_name
  FROM claims c
  JOIN policies p ON c.policy_id = p.id
  JOIN products pr ON p.product_id = pr.id
  JOIN users u ON c.claimant_id = u.id
  LEFT JOIN users a ON c.assigned_to = a.id
  LEFT JOIN users es ON c.escalated_to = es.id
  ORDER BY c.created_at DESC
`);

const getPendingClaimsStmt = db.prepare(`
  SELECT c.*, p.policy_number, pr.name as product_name,
         u.name as claimant_name
  FROM claims c
  JOIN policies p ON c.policy_id = p.id
  JOIN products pr ON p.product_id = pr.id
  JOIN users u ON c.claimant_id = u.id
  WHERE c.status IN ('pending', 'in_review', 'validating')
  ORDER BY c.created_at ASC
`);

const getClaimByIdStmt = db.prepare(`
  SELECT c.*, p.policy_number, p.sum_assured, p.status as policy_status,
         p.start_date, p.end_date, pr.name as product_name, pr.category as product_category,
         u.name as claimant_name, u.email as claimant_email, u.phone as claimant_phone,
         a.name as assigned_name, es.name as escalated_name
  FROM claims c
  JOIN policies p ON c.policy_id = p.id
  JOIN products pr ON p.product_id = pr.id
  JOIN users u ON c.claimant_id = u.id
  LEFT JOIN users a ON c.assigned_to = a.id
  LEFT JOIN users es ON c.escalated_to = es.id
  WHERE c.id = ?
`);

const insertClaimStmt = db.prepare(`
  INSERT INTO claims
  (id, claim_number, policy_id, claimant_id, incident_date, 
   incident_description, claim_amount, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
`);

const updateClaimStatusStmt = db.prepare(`
  UPDATE claims SET
    status = ?, updated_at = datetime('now')
  WHERE id = ?
`);

const updateClaimWithResultStmt = db.prepare(`
  UPDATE claims SET
    status = ?, approved_amount = ?, claim_engine_result = ?,
    site_snapshots = ?, fingerprint_result = ?, compliance_result = ?,
    updated_at = datetime('now')
  WHERE id = ?
`);

const assignClaimStmt = db.prepare(`
  UPDATE claims SET
    status = 'in_review', assigned_to = ?, updated_at = datetime('now')
  WHERE id = ?
`);

const escalateClaimStmt = db.prepare(`
  UPDATE claims SET
    status = 'escalated', escalated_to = ?, escalated_at = datetime('now'),
    escalated_reason = ?, updated_at = datetime('now')
  WHERE id = ?
`);

const payClaimStmt = db.prepare(`
  UPDATE claims SET
    status = 'completed', paid_at = datetime('now'),
    payment_transaction_id = ?, updated_at = datetime('now')
  WHERE id = ?
`);

const rejectClaimStmt = db.prepare(`
  UPDATE claims SET
    status = 'rejected', rejected_reason = ?, updated_at = datetime('now')
  WHERE id = ?
`);

router.get('/', AuthMiddleware.authenticate, (req, res) => {
  try {
    let claims;
    
    if (req.user.role === config.roles.POLICYHOLDER) {
      claims = getClaimsByUserStmt.all(req.user.id);
    } else {
      claims = getAllClaimsStmt.all();
    }
    
    res.json({ claims });
  } catch (err) {
    console.error('Get claims error:', err);
    res.status(500).json({ error: '获取理赔列表失败' });
  }
});

router.get('/pending', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.CLAIM_ADJUSTER, config.roles.ADMIN), (req, res) => {
  try {
    const claims = getPendingClaimsStmt.all();
    res.json({ claims });
  } catch (err) {
    console.error('Get pending claims error:', err);
    res.status(500).json({ error: '获取待处理理赔失败' });
  }
});

router.get('/:claimId', AuthMiddleware.authenticate, (req, res) => {
  try {
    const claim = getClaimByIdStmt.get(req.params.claimId);
    
    if (!claim) {
      return res.status(404).json({ error: '理赔申请不存在' });
    }
    
    if (req.user.role === config.roles.POLICYHOLDER && claim.claimant_id !== req.user.id) {
      return res.status(403).json({ error: '无权访问此理赔申请' });
    }
    
    const auditLogs = AuditService.getByEntity('claim', req.params.claimId);
    const vaultTrail = policyVault.getAuditTrail('claim', req.params.claimId);
    
    res.json({
      claim: {
        ...claim,
        site_snapshots: claim.site_snapshots ? JSON.parse(claim.site_snapshots) : null,
        fingerprint_result: claim.fingerprint_result ? JSON.parse(claim.fingerprint_result) : null,
        compliance_result: claim.compliance_result ? JSON.parse(claim.compliance_result) : null,
        claim_engine_result: claim.claim_engine_result ? JSON.parse(claim.claim_engine_result) : null
      },
      auditLogs,
      vaultTrail
    });
  } catch (err) {
    console.error('Get claim error:', err);
    res.status(500).json({ error: '获取理赔详情失败' });
  }
});

router.post('/', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.POLICYHOLDER), (req, res) => {
  try {
    const { policy_id, incident_date, incident_description, claim_amount } = req.body;
    
    if (!policy_id || !incident_date || !claim_amount) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const getPolicyStmt = db.prepare('SELECT * FROM policies WHERE id = ? AND policyholder_id = ?');
    const policy = getPolicyStmt.get(policy_id, req.user.id);
    
    if (!policy) {
      return res.status(404).json({ error: '保单不存在或不属于您' });
    }
    
    if (policy.status !== 'active') {
      return res.status(400).json({ error: '保单不在有效状态' });
    }
    
    const id = uuidv4();
    const claimNumber = generateClaimNumber();
    
    insertClaimStmt.run(
      id,
      claimNumber,
      policy_id,
      req.user.id,
      incident_date,
      incident_description || '',
      claim_amount
    );
    
    AuditService.log('claim', id, 'create', req.user.id, req.user.role, {
      claimNumber,
      policy_id,
      claim_amount
    }, 'success');
    
    NotificationService.broadcastToRole(
      config.roles.CLAIM_ADJUSTER,
      '新理赔申请',
      '保单 ' + policy.policy_number + ' 有新的理赔申请，请及时处理',
      'claim',
      'claim',
      id
    );
    
    res.json({
      claim: {
        id,
        claim_number: claimNumber,
        status: 'pending'
      },
      message: '理赔申请已提交，等待处理'
    });
  } catch (err) {
    console.error('Create claim error:', err);
    res.status(500).json({ error: '创建理赔申请失败' });
  }
});

router.post('/:claimId/upload-snapshots', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.CLAIM_ADJUSTER, config.roles.ADMIN), (req, res) => {
  try {
    const { snapshots } = req.body;
    const claim = getClaimByIdStmt.get(req.params.claimId);
    
    if (!claim) {
      return res.status(404).json({ error: '理赔申请不存在' });
    }
    
    const updateStmt = db.prepare(`
      UPDATE claims SET site_snapshots = ?, status = 'validating', updated_at = datetime('now')
      WHERE id = ?
    `);
    
    updateStmt.run(JSON.stringify(snapshots), req.params.claimId);
    
    AuditService.log('claim', req.params.claimId, 'upload_snapshots', req.user.id, req.user.role, {}, 'success');
    
    res.json({ message: '现场快照已上传，进入合规校验' });
  } catch (err) {
    console.error('Upload snapshots error:', err);
    res.status(500).json({ error: '上传快照失败' });
  }
});

router.post('/:claimId/evaluate', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.CLAIM_ADJUSTER, config.roles.ADMIN), (req, res) => {
  try {
    const claim = getClaimByIdStmt.get(req.params.claimId);
    
    if (!claim) {
      return res.status(404).json({ error: '理赔申请不存在' });
    }
    
    const getPolicyStmt = db.prepare('SELECT * FROM policies WHERE id = ?');
    const policy = getPolicyStmt.get(claim.policy_id);
    
    const getHistoricalClaimsStmt = db.prepare('SELECT * FROM claims WHERE claimant_id = ? AND id != ?');
    const historicalClaims = getHistoricalClaimsStmt.all(claim.claimant_id, claim.id);
    
    const snapshots = claim.site_snapshots ? JSON.parse(claim.site_snapshots) : [];
    
    const result = claimAudit.evaluateClaim(policy, claim, ['事故证明', '身份证明'], historicalClaims);
    
    updateClaimWithResultStmt.run(
      result.decision === 'instant_payment' ? 'approved' : 
      result.decision === 'approve' ? 'approved' :
      result.decision === 'reject' ? 'rejected' : 'in_review',
      result.payout.approvedAmount,
      JSON.stringify(result),
      claim.site_snapshots,
      JSON.stringify(result.fingerprintVerification),
      JSON.stringify(result.complianceCheck),
      req.params.claimId
    );
    
    policyVault.storeRecord('claim', req.params.claimId, 'evaluated', claim, {
      engineDecision: result.decision,
      approvedAmount: result.payout.approvedAmount
    });
    
    AuditService.log('claim', req.params.claimId, 'engine_evaluate', req.user.id, req.user.role, {
      decision: result.decision,
      riskScore: result.totalRisk
    }, 'success');
    
    if (result.decision === 'instant_payment') {
      const transactionId = 'TXN' + Date.now().toString();
      payClaimStmt.run(transactionId, req.params.claimId);
      
      NotificationService.create(
        claim.claimant_id,
        '理赔已到账',
        '恭喜！您的理赔申请 ' + claim.claim_number + ' 已通过秒赔，赔付金额 ' + result.payout.approvedAmount + ' 元已到账',
        'success',
        'claim',
        req.params.claimId
      );
      
      res.json({
        message: '秒赔通过，已完成支付',
        engineResult: {
          decision: result.decision,
          decisionReason: result.decisionReason,
          approvedAmount: result.payout.approvedAmount
        }
      });
    } else if (result.decision === 'approve') {
      NotificationService.create(
        claim.claimant_id,
        '理赔审核通过',
        '您的理赔申请 ' + claim.claim_number + ' 审核通过，赔付金额 ' + result.payout.approvedAmount + ' 元将很快到账',
        'info',
        'claim',
        req.params.claimId
      );
      
      res.json({
        message: '审核通过，等待支付',
        engineResult: {
          decision: result.decision,
          decisionReason: result.decisionReason,
          approvedAmount: result.payout.approvedAmount
        }
      });
    } else if (result.decision === 'reject') {
      rejectClaimStmt.run(result.decisionReason, req.params.claimId);
      
      NotificationService.create(
        claim.claimant_id,
        '理赔申请被拒',
        '很抱歉，您的理赔申请 ' + claim.claim_number + ' 未能通过审核，原因：' + result.decisionReason,
        'warning',
        'claim',
        req.params.claimId
      );
      
      res.json({
        message: '理赔被拒',
        engineResult: {
          decision: result.decision,
          decisionReason: result.decisionReason
        }
      });
    } else {
      res.json({
        message: '需要人工审核',
        engineResult: {
          decision: result.decision,
          decisionReason: result.decisionReason,
          riskScore: result.totalRisk
        }
      });
    }
  } catch (err) {
    console.error('Evaluate claim error:', err);
    res.status(500).json({ error: '理赔评估失败' });
  }
});

router.post('/:claimId/assign', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.CLAIM_ADJUSTER, config.roles.ADMIN), (req, res) => {
  try {
    const { assigned_to } = req.body;
    const claim = getClaimByIdStmt.get(req.params.claimId);
    
    if (!claim) {
      return res.status(404).json({ error: '理赔申请不存在' });
    }
    
    assignClaimStmt.run(assigned_to || req.user.id, req.params.claimId);
    
    AuditService.log('claim', req.params.claimId, 'assign', req.user.id, req.user.role, {
      assigned_to: assigned_to || req.user.id
    }, 'success');
    
    res.json({ message: '理赔已分配处理' });
  } catch (err) {
    console.error('Assign claim error:', err);
    res.status(500).json({ error: '分配理赔失败' });
  }
});

router.post('/:claimId/escalate', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.CLAIM_ADJUSTER, config.roles.ADMIN), (req, res) => {
  try {
    const { reason } = req.body;
    const claim = getClaimByIdStmt.get(req.params.claimId);
    
    if (!claim) {
      return res.status(404).json({ error: '理赔申请不存在' });
    }
    
    const getAdminsStmt = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1');
    const admin = getAdminsStmt.get(config.roles.ADMIN);
    
    escalateClaimStmt.run(admin?.id || null, reason || '需要升级处理', req.params.claimId);
    
    AuditService.log('claim', req.params.claimId, 'escalate', req.user.id, req.user.role, {
      reason
    }, 'success');
    
    res.json({ message: '理赔已升级处理' });
  } catch (err) {
    console.error('Escalate claim error:', err);
    res.status(500).json({ error: '升级理赔失败' });
  }
});

router.post('/:claimId/approve', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.CLAIM_ADJUSTER, config.roles.ADMIN), (req, res) => {
  try {
    const { approved_amount } = req.body;
    const claim = getClaimByIdStmt.get(req.params.claimId);
    
    if (!claim) {
      return res.status(404).json({ error: '理赔申请不存在' });
    }
    
    const updateStmt = db.prepare(`
      UPDATE claims SET status = 'approved', approved_amount = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    
    updateStmt.run(approved_amount || claim.claim_amount, req.params.claimId);
    
    AuditService.log('claim', req.params.claimId, 'approve', req.user.id, req.user.role, {
      approved_amount: approved_amount || claim.claim_amount
    }, 'success');
    
    NotificationService.create(
      claim.claimant_id,
      '理赔审核通过',
      '您的理赔申请 ' + claim.claim_number + ' 已通过审核',
      'info',
      'claim',
      req.params.claimId
    );
    
    res.json({ message: '理赔已批准' });
  } catch (err) {
    console.error('Approve claim error:', err);
    res.status(500).json({ error: '批准理赔失败' });
  }
});

router.post('/:claimId/pay', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.CLAIM_ADJUSTER, config.roles.ADMIN), (req, res) => {
  try {
    const claim = getClaimByIdStmt.get(req.params.claimId);
    
    if (!claim) {
      return res.status(404).json({ error: '理赔申请不存在' });
    }
    
    if (claim.status !== 'approved') {
      return res.status(400).json({ error: '理赔尚未批准' });
    }
    
    const transactionId = 'TXN' + Date.now().toString();
    payClaimStmt.run(transactionId, req.params.claimId);
    
    policyVault.storeRecord('claim', req.params.claimId, 'paid', claim, {
      transactionId,
      paidAt: dayjs().format()
    });
    
    AuditService.log('claim', req.params.claimId, 'pay', req.user.id, req.user.role, {
      transactionId
    }, 'success');
    
    NotificationService.create(
      claim.claimant_id,
      '理赔已到账',
      '您的理赔申请 ' + claim.claim_number + ' 已完成支付，交易单号：' + transactionId,
      'success',
      'claim',
      req.params.claimId
    );
    
    res.json({ message: '支付已完成', transactionId });
  } catch (err) {
    console.error('Pay claim error:', err);
    res.status(500).json({ error: '支付理赔失败' });
  }
});

router.post('/:claimId/reject', AuthMiddleware.authenticate, AuthMiddleware.requireRole(config.roles.CLAIM_ADJUSTER, config.roles.ADMIN), (req, res) => {
  try {
    const { reason } = req.body;
    const claim = getClaimByIdStmt.get(req.params.claimId);
    
    if (!claim) {
      return res.status(404).json({ error: '理赔申请不存在' });
    }
    
    rejectClaimStmt.run(reason || '审核不通过', req.params.claimId);
    
    AuditService.log('claim', req.params.claimId, 'reject', req.user.id, req.user.role, {
      reason
    }, 'success');
    
    NotificationService.create(
      claim.claimant_id,
      '理赔申请被拒',
      '您的理赔申请 ' + claim.claim_number + ' 未能通过审核',
      'warning',
      'claim',
      req.params.claimId
    );
    
    res.json({ message: '理赔已拒绝' });
  } catch (err) {
    console.error('Reject claim error:', err);
    res.status(500).json({ error: '拒绝理赔失败' });
  }
});

module.exports = router;
