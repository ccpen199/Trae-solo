const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const WITHDRAWAL_TYPES = {
  rent: {
    name: '租房提取',
    maxAmount: 1500,
    maxMonths: 12,
    requiredDocuments: [
      { key: 'rent_contract', name: '租房合同' },
      { key: 'rent_receipt', name: '租金发票' }
    ],
    approvalThreshold: 50000,
    requiresOCR: true,
    requiresFaceAuth: true,
    requiresUnionPay: false,
    description: '用于支付房租的提取，每月最高1500元，最长提取12个月',
    conditions: ['连续缴存满3个月', '本人及配偶在本市无自有住房']
  },
  house_purchase: {
    name: '购房提取',
    maxAmount: null,
    maxMonths: null,
    requiredDocuments: [
      { key: 'house_contract', name: '购房合同' },
      { key: 'invoice', name: '购房发票' },
      { key: 'property_cert', name: '房产证' }
    ],
    approvalThreshold: 200000,
    requiresOCR: true,
    requiresFaceAuth: true,
    requiresUnionPay: true,
    description: '购买自住住房的提取，总额不超过购房款',
    conditions: ['购买自住住房', '提取金额不超过购房总价', '未使用公积金贷款']
  },
  resignation: {
    name: '离职提取',
    maxAmount: null,
    maxMonths: null,
    requiredDocuments: [
      { key: 'resignation_proof', name: '离职证明' },
      { key: 'id_card_copy', name: '身份证复印件' }
    ],
    approvalThreshold: 100000,
    requiresOCR: true,
    requiresFaceAuth: true,
    requiresUnionPay: false,
    description: '与单位解除劳动关系后提取，需封存满6个月',
    conditions: ['账户封存满6个月', '未在其他中心继续缴存', '无未结清公积金贷款']
  },
  serious_illness: {
    name: '大病提取',
    maxAmount: null,
    maxMonths: null,
    requiredDocuments: [
      { key: 'medical_certificate', name: '诊断证明' },
      { key: 'medical_bill', name: '医疗费用发票' },
      { key: 'hospital_record', name: '住院病历' }
    ],
    approvalThreshold: 300000,
    requiresOCR: true,
    requiresFaceAuth: true,
    requiresUnionPay: true,
    description: '因重大疾病支付医疗费用的提取',
    conditions: ['本人或配偶患重大疾病', '提取金额不超过自付医疗费用', '提供二级以上医院证明']
  },
  renovation: {
    name: '装修提取',
    maxAmount: 100000,
    maxMonths: null,
    requiredDocuments: [
      { key: 'renovation_contract', name: '装修合同' },
      { key: 'property_owner_cert', name: '房屋产权证明' },
      { key: 'renovation_permit', name: '装修许可证' }
    ],
    approvalThreshold: 100000,
    requiresOCR: true,
    requiresFaceAuth: false,
    requiresUnionPay: false,
    description: '自住住房装修提取，最高100000元',
    conditions: ['房屋产权为本人或配偶', '装修合同真实有效', '每套住房仅可提取一次']
  },
  retirement: {
    name: '退休提取',
    maxAmount: null,
    maxMonths: null,
    requiredDocuments: [
      { key: 'retirement_proof', name: '退休证' },
      { key: 'id_card_copy', name: '身份证复印件' }
    ],
    approvalThreshold: 500000,
    requiresOCR: true,
    requiresFaceAuth: true,
    requiresUnionPay: false,
    description: '达到法定退休年龄提取全部余额',
    conditions: ['达到法定退休年龄', '无未结清公积金贷款', '账户状态正常']
  }
};

router.get('/types', authenticateToken, (req, res) => {
  res.json(WITHDRAWAL_TYPES);
});

router.post('/apply', authenticateToken, requireRole('personal'), auditLog('提取申请', '提取业务'), (req, res) => {
  const { type, amount, reason, materials } = req.body;

  if (!WITHDRAWAL_TYPES[type]) {
    return res.status(400).json({ error: '不支持的提取类型', code: 'INVALID_TYPE' });
  }

  const typeConfig = WITHDRAWAL_TYPES[type];
  const errors = [];

  if (typeConfig.maxAmount && amount > typeConfig.maxAmount * (typeConfig.maxMonths || 1)) {
    errors.push({
      rule: 'max_amount',
      message: `${typeConfig.name}最高提取金额为${typeConfig.maxAmount * (typeConfig.maxMonths || 1)}元（${typeConfig.maxMonths ? typeConfig.maxMonths + '个月×' : ''}${typeConfig.maxAmount}元/月）`,
      current: amount,
      limit: typeConfig.maxAmount * (typeConfig.maxMonths || 1)
    });
  }

  const account = db.prepare('SELECT * FROM personal_accounts WHERE user_id = ?').get(req.user.id);
  if (!account) {
    return res.status(404).json({ error: '账户不存在' });
  }

  if (account.balance < amount) {
    errors.push({
      rule: 'insufficient_balance',
      message: `账户余额不足，当前余额${account.balance}元，申请提取${amount}元`,
      current: account.balance,
      required: amount
    });
  }

  if (typeConfig.approvalThreshold && amount >= typeConfig.approvalThreshold) {
    errors.push({
      rule: 'above_approval_threshold',
      message: `提取金额超过审批阈值${typeConfig.approvalThreshold}元，需额外审核`,
      threshold: typeConfig.approvalThreshold,
      level: 'warning'
    });
  }

  const submittedDocs = materials || [];
  const missingDocs = typeConfig.requiredDocuments.filter(
    doc => !submittedDocs.includes(doc.key)
  );
  if (missingDocs.length > 0) {
    errors.push({
      rule: 'missing_documents',
      message: `缺少必要材料：${missingDocs.map(d => d.name).join('、')}`,
      missing: missingDocs
    });
  }

  const verificationRequirements = [];
  if (typeConfig.requiresOCR) {
    verificationRequirements.push({ type: 'ocr_id_card', name: '身份证OCR识别', required: true });
  }
  if (typeConfig.requiresFaceAuth) {
    verificationRequirements.push({ type: 'face_recognition', name: '人脸识别', required: true });
  }
  if (typeConfig.requiresUnionPay) {
    verificationRequirements.push({ type: 'unionpay_auth', name: '银联认证', required: true });
  }

  const user = db.prepare('SELECT center_id FROM users WHERE id = ?').get(req.user.id);

  const result = db.prepare(`
    INSERT INTO withdrawal_applications (user_id, type, amount, reason, materials, status, center_id)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(req.user.id, type, amount, reason, JSON.stringify(materials || []), user.center_id);

  const applicationId = result.lastInsertRowid;

  for (const vr of verificationRequirements) {
    db.prepare(`
      INSERT INTO verification_records (user_id, application_id, verification_type, status)
      VALUES (?, ?, ?, 'pending')
    `).run(req.user.id, applicationId, vr.type);
  }

  checkRisk(req.user.id, applicationId, type, amount);

  const hasBlockingErrors = errors.some(e => e.rule !== 'above_approval_threshold' && e.rule !== 'missing_documents');
  if (hasBlockingErrors) {
    db.prepare(`UPDATE withdrawal_applications SET status = 'rejected', reject_reason = ? WHERE id = ?`)
      .run(errors.filter(e => e.rule !== 'above_approval_threshold').map(e => e.message).join('；'), applicationId);
    return res.status(400).json({
      error: '申请被拒绝',
      code: 'APPLICATION_REJECTED',
      application_id: applicationId,
      errors
    });
  }

  const pendingVerifications = verificationRequirements.map(vr => vr.type);

  res.json({
    id: applicationId,
    message: pendingVerifications.length > 0
      ? '申请已提交，请完成身份验证后等待审批'
      : '申请提交成功，等待审批',
    verification_required: pendingVerifications,
    verification_requirements: verificationRequirements,
    warnings: errors.filter(e => e.rule === 'above_approval_threshold'),
    missing_documents: missingDocs.length > 0 ? missingDocs : undefined
  });
});

router.post('/verify/:applicationId/:type', authenticateToken, requireRole('personal'), auditLog('身份验证', '提取业务'), (req, res) => {
  const { applicationId, type } = req.params;
  const validTypes = ['ocr_id_card', 'face_recognition', 'unionpay_auth'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: '不支持的验证类型', valid_types: validTypes });
  }

  const application = db.prepare(`
    SELECT wa.* FROM withdrawal_applications wa WHERE wa.id = ? AND wa.user_id = ?
  `).get(applicationId, req.user.id);

  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }

  if (application.status !== 'pending') {
    return res.status(400).json({ error: '申请已处理，无需验证' });
  }

  const typeConfig = WITHDRAWAL_TYPES[application.type];
  if (!typeConfig) {
    return res.status(400).json({ error: '申请类型配置异常' });
  }

  const isRequired = (type === 'ocr_id_card' && typeConfig.requiresOCR) ||
                     (type === 'face_recognition' && typeConfig.requiresFaceAuth) ||
                     (type === 'unionpay_auth' && typeConfig.requiresUnionPay);
  if (!isRequired) {
    return res.status(400).json({ error: `当前提取类型不需要${type === 'ocr_id_card' ? 'OCR识别' : type === 'face_recognition' ? '人脸识别' : '银联认证'}` });
  }

  const { status: verifyStatus, detail } = req.body;
  const finalStatus = verifyStatus === 'failed' ? 'failed' : 'verified';

  const simulatedDetail = detail || (finalStatus === 'verified'
    ? (type === 'ocr_id_card' ? '身份证OCR识别通过，信息一致'
       : type === 'face_recognition' ? '人脸比对通过，相似度97.2%'
       : '银联账户验证通过')
    : (type === 'ocr_id_card' ? '身份证OCR识别失败，信息不一致'
       : type === 'face_recognition' ? '人脸比对失败，相似度低于阈值'
       : '银联账户验证失败'));

  db.prepare(`
    UPDATE verification_records
    SET status = ?, detail = ?, verified_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND application_id = ? AND verification_type = ?
  `).run(finalStatus, simulatedDetail, req.user.id, applicationId, type);

  if (finalStatus === 'verified') {
    const allVerifications = db.prepare(`
      SELECT verification_type, status FROM verification_records
      WHERE user_id = ? AND application_id = ?
    `).all(req.user.id, applicationId);

    const requiredTypes = [];
    if (typeConfig.requiresOCR) requiredTypes.push('ocr_id_card');
    if (typeConfig.requiresFaceAuth) requiredTypes.push('face_recognition');
    if (typeConfig.requiresUnionPay) requiredTypes.push('unionpay_auth');

    const allVerified = requiredTypes.every(rt =>
      allVerifications.some(v => v.verification_type === rt && v.status === 'verified')
    );
    const anyFailed = requiredTypes.some(rt =>
      allVerifications.some(v => v.verification_type === rt && v.status === 'failed')
    );

    if (anyFailed) {
      return res.json({
        message: '验证完成，但存在失败项，请重新验证',
        verification_type: type,
        status: 'failed',
        all_verifications: allVerifications,
        application_status: 'pending'
      });
    }

    if (allVerified) {
      return res.json({
        message: '所有验证已完成，申请等待审批',
        verification_type: type,
        status: 'verified',
        all_verifications: allVerifications,
        application_status: 'pending'
      });
    }
  }

  const allVerifications = db.prepare(`
    SELECT verification_type, status FROM verification_records
    WHERE user_id = ? AND application_id = ?
  `).all(req.user.id, applicationId);

  res.json({
    message: finalStatus === 'verified' ? '验证通过' : '验证失败，请重试',
    verification_type: type,
    status: finalStatus,
    detail: simulatedDetail,
    all_verifications: allVerifications,
    application_status: application.status
  });
});

function checkRisk(userId, applicationId, type, amount) {
  const recentApplications = db.prepare(`
    SELECT COUNT(*) as count FROM withdrawal_applications
    WHERE user_id = ? AND created_at >= datetime('now', '-30 day')
  `).get(userId).count;

  if (recentApplications >= 3) {
    db.prepare(`
      INSERT INTO risk_alerts (type, level, user_id, application_id, description)
      VALUES ('frequent_withdrawal', 'warning', ?, ?, '30天内多次提取')
    `).run(userId, applicationId);
  }

  if (amount > 50000) {
    db.prepare(`
      INSERT INTO risk_alerts (type, level, user_id, application_id, description)
      VALUES ('large_amount', 'high', ?, ?, '大额提取申请')
    `).run(userId, applicationId);
  }
}

router.get('/my', authenticateToken, requireRole('personal'), (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT wa.*, c.name as center_name,
           u.name as approver_name
    FROM withdrawal_applications wa
    JOIN centers c ON wa.center_id = c.id
    LEFT JOIN users u ON wa.approver_id = u.id
    WHERE wa.user_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ' AND wa.status = ?';
    params.push(status);
  }

  query += ' ORDER BY wa.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const applications = db.prepare(query).all(...params);

  const enrichedApplications = applications.map(app => {
    const verifications = db.prepare(`
      SELECT verification_type, status, detail, verified_at
      FROM verification_records
      WHERE user_id = ? AND application_id = ?
    `).all(req.user.id, app.id);

    const typeName = WITHDRAWAL_TYPES[app.type]?.name || app.type;
    const typeConfig = WITHDRAWAL_TYPES[app.type];

    return {
      ...app,
      type_name: typeName,
      required_verifications: typeConfig ? [
        typeConfig.requiresOCR ? 'ocr_id_card' : null,
        typeConfig.requiresFaceAuth ? 'face_recognition' : null,
        typeConfig.requiresUnionPay ? 'unionpay_auth' : null
      ].filter(Boolean) : [],
      verification_records: verifications,
      materials: JSON.parse(app.materials || '[]')
    };
  });

  let countQuery = 'SELECT COUNT(*) as total FROM withdrawal_applications WHERE user_id = ?';
  const countParams = [req.user.id];
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }
  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({
    applications: enrichedApplications,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/my-applications', authenticateToken, requireRole('personal'), (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT wa.*, c.name as center_name
    FROM withdrawal_applications wa
    JOIN centers c ON wa.center_id = c.id
    WHERE wa.user_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ' AND wa.status = ?';
    params.push(status);
  }

  query += ' ORDER BY wa.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const applications = db.prepare(query).all(...params);

  res.json(applications);
});

router.get('/pending', authenticateToken, requireRole('supervisor', 'super_admin'), (req, res) => {
  const centerId = req.user.centerId;
  let query = `
    SELECT wa.*, u.name as user_name, u.id_card
    FROM withdrawal_applications wa
    JOIN users u ON wa.user_id = u.id
    WHERE wa.status = 'pending'
  `;
  const params = [];

  if (req.user.role !== 'super_admin') {
    query += ' AND wa.center_id = ?';
    params.push(centerId);
  }

  query += ' ORDER BY wa.created_at DESC';

  const applications = db.prepare(query).all(...params);

  res.json(applications);
});

router.post('/:id/approve', authenticateToken, requireRole('supervisor', 'super_admin'), auditLog('审批提取', '提取业务'), (req, res) => {
  const applicationId = req.params.id;
  const rejectReason = req.body.rejectReason;
  const approved = req.body.approved !== false;

  const application = db.prepare('SELECT * FROM withdrawal_applications WHERE id = ?').get(applicationId);

  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }

  if (application.status !== 'pending') {
    return res.status(400).json({ error: '申请已处理' });
  }

  const typeConfig = WITHDRAWAL_TYPES[application.type];

  if (approved && typeConfig) {
    const requiredTypes = [];
    if (typeConfig.requiresOCR) requiredTypes.push('ocr_id_card');
    if (typeConfig.requiresFaceAuth) requiredTypes.push('face_recognition');
    if (typeConfig.requiresUnionPay) requiredTypes.push('unionpay_auth');

    const verifications = db.prepare(`
      SELECT verification_type, status FROM verification_records
      WHERE user_id = ? AND application_id = ?
    `).all(application.user_id, applicationId);

    const unverified = requiredTypes.filter(rt =>
      !verifications.some(v => v.verification_type === rt && v.status === 'verified')
    );

    if (unverified.length > 0) {
      const typeNames = {
        ocr_id_card: '身份证OCR识别',
        face_recognition: '人脸识别',
        unionpay_auth: '银联认证'
      };
      return res.status(400).json({
        error: `身份验证未完成：${unverified.map(t => typeNames[t]).join('、')}`,
        unverified_types: unverified
      });
    }
  }

  if (approved) {
    const account = db.prepare('SELECT * FROM personal_accounts WHERE user_id = ?').get(application.user_id);

    if (account.balance < application.amount) {
      return res.status(400).json({ error: '余额不足' });
    }

    db.prepare(`
      UPDATE personal_accounts
      SET balance = balance - ?
      WHERE user_id = ?
    `).run(application.amount, application.user_id);

    const typeName = typeConfig?.name || '提取';
    db.prepare(`
      INSERT INTO transaction_records (account_id, type, amount, balance_after, description, source_type, source_id)
      SELECT id, 'withdrawal', ?, balance, ?, 'withdrawal', ?
      FROM personal_accounts WHERE user_id = ?
    `).run(application.amount, typeName, applicationId, application.user_id);

    db.prepare(`
      UPDATE withdrawal_applications
      SET status = 'approved', approver_id = ?, approve_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, applicationId);
  } else {
    db.prepare(`
      UPDATE withdrawal_applications
      SET status = 'rejected', approver_id = ?, reject_reason = ?, approve_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, rejectReason, applicationId);
  }

  res.json({ message: approved ? '审批通过' : '已驳回' });
});

module.exports = router;
