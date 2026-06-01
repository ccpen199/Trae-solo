const express = require('express');
const router = express.Router();

function generateClaimNo() {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CLM${ymd}${random}`;
}

router.get('/', (req, res) => {
  const { report_id, policy_id, status, limit = 50, offset = 0 } = req.query;
  let sql = `
    SELECT c.*, r.report_no, r.disaster_type, r.damaged_area,
           p.policy_no, p.crop_type, p.insurance_amount,
           f.name as farmer_name, u.name as reviewer_name,
           s.loss_ratio, s.estimated_loss
    FROM claims c
    LEFT JOIN reports r ON c.report_id = r.id
    LEFT JOIN policies p ON c.policy_id = p.id
    LEFT JOIN farmers f ON p.farmer_id = f.id
    LEFT JOIN users u ON c.reviewer_id = u.id
    LEFT JOIN surveys s ON s.report_id = r.id
    WHERE 1=1
  `;
  const params = [];
  if (report_id) { sql += ' AND c.report_id = ?'; params.push(report_id); }
  if (policy_id) { sql += ' AND c.policy_id = ?'; params.push(policy_id); }
  if (status) { sql += ' AND c.status = ?'; params.push(status); }
  sql += ' ORDER BY c.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  let data = req.db.prepare(sql).all(...params);
  
  const approvalSql = `
    SELECT ca.claim_id, ca.approver_role, ca.approval_status, ca.approval_opinion, ca.approval_time,
           u.name as approver_name
    FROM claim_approvals ca
    LEFT JOIN users u ON ca.approver_id = u.id
    ORDER BY ca.step
  `;
  const allApprovals = req.db.prepare(approvalSql).all();
  
  const approvalMap = {};
  allApprovals.forEach(a => {
    if (!approvalMap[a.claim_id]) approvalMap[a.claim_id] = [];
    approvalMap[a.claim_id].push(a);
  });
  
  data = data.map(c => ({ ...c, approvals: approvalMap[c.id] || null }));
  
  let countSql = 'SELECT COUNT(*) as count FROM claims WHERE 1=1';
  const countParams = [];
  if (report_id) { countSql += ' AND report_id = ?'; countParams.push(report_id); }
  if (policy_id) { countSql += ' AND policy_id = ?'; countParams.push(policy_id); }
  if (status) { countSql += ' AND status = ?'; countParams.push(status); }
  const total = req.db.prepare(countSql).get(...countParams).count;
  
  res.json({ data, total, limit: parseInt(limit), offset: parseInt(offset) });
});

router.get('/:id', (req, res) => {
  const data = req.db.prepare(`
    SELECT c.*, r.report_no, r.disaster_type, r.disaster_time, r.damaged_area,
           p.policy_no, p.crop_type, p.area as policy_area, p.insurance_amount,
           p.deductible_ratio, p.deductible_clause,
           f.name as farmer_name, f.phone as farmer_phone, f.id_card as farmer_id_card,
           s.loss_ratio, s.estimated_loss, s.survey_opinion,
           su.name as surveyor_name, u.name as reviewer_name
    FROM claims c
    LEFT JOIN reports r ON c.report_id = r.id
    LEFT JOIN policies p ON c.policy_id = p.id
    LEFT JOIN farmers f ON p.farmer_id = f.id
    LEFT JOIN surveys s ON s.report_id = r.id
    LEFT JOIN users su ON s.surveyor_id = su.id
    LEFT JOIN users u ON c.reviewer_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!data) return res.status(404).json({ error: '理赔记录不存在' });

  const approvals = req.db.prepare(`
    SELECT ca.*, u.name as approver_name
    FROM claim_approvals ca
    LEFT JOIN users u ON ca.approver_id = u.id
    WHERE ca.claim_id = ?
    ORDER BY ca.step
  `).all(req.params.id);

  res.json({ ...data, approvals });
});

router.post('/', (req, res) => {
  const { report_id, reviewer_id } = req.body;

  if (!report_id) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  const report = req.db.prepare('SELECT * FROM reports WHERE id = ?').get(report_id);
  if (!report) return res.status(404).json({ error: '报案不存在' });
  if (report.status !== 'surveyed') {
    return res.status(400).json({ error: '报案未完成查勘，暂不能理赔审核' });
  }

  const policy = req.db.prepare('SELECT * FROM policies WHERE id = ?').get(report.policy_id);
  if (!policy) return res.status(404).json({ error: '保单不存在' });

  const survey = req.db.prepare('SELECT * FROM surveys WHERE report_id = ?').get(report_id);
  if (!survey) return res.status(404).json({ error: '查勘记录不存在' });

  const existing = req.db.prepare('SELECT * FROM claims WHERE report_id = ?').get(report_id);
  if (existing) {
    return res.status(400).json({ error: '该报案已有理赔记录', existing_claim_id: existing.id });
  }

  const policy_valid = policy.status === 'active' && policy.payment_status === 'paid';
  const now = new Date();
  const startDate = new Date(policy.start_date);
  const endDate = new Date(policy.end_date);
  const in_period = now >= startDate && now <= endDate;

  const duplicate_report = req.db.prepare(`
    SELECT COUNT(*) as count FROM reports 
    WHERE policy_id = ? AND disaster_type = ? AND id != ?
    AND status != 'rejected'
    AND ABS(strftime('%s', disaster_time) - strftime('%s', ?)) < 86400
  `).get(policy.id, report.disaster_type, report.id, report.disaster_time).count > 0;

  const materials_complete = true;
  const missing_materials = null;

  const deductible_ratio = policy.deductible_ratio || 0.1;
  const base_compensation = policy.insurance_amount * report.damaged_area / policy.area * survey.loss_ratio;
  const deductible_applied = base_compensation * deductible_ratio;
  const compensation_amount = Math.max(0, base_compensation - deductible_applied);

  const claim_no = generateClaimNo();

  const info = req.db.prepare(`
    INSERT INTO claims (
      claim_no, report_id, policy_id, policy_valid, deductible_applied,
      duplicate_report, materials_complete, missing_materials,
      compensation_amount, status, reviewer_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'reviewing', ?)
  `).run(
    claim_no, report_id, policy.id, policy_valid && in_period ? 1 : 0,
    deductible_applied, duplicate_report ? 1 : 0,
    materials_complete ? 1 : 0, missing_materials,
    compensation_amount, reviewer_id
  );

  const steps = [
    { role: 'insurer', step: 1 },
    { role: 'township', step: 2 },
    { role: 'regulator', step: 3 }
  ];
  const insertApproval = req.db.prepare(`
    INSERT INTO claim_approvals (claim_id, approver_role, approval_status, step)
    VALUES (?, ?, 'pending', ?)
  `);
  steps.forEach(s => insertApproval.run(info.lastInsertRowid, s.role, s.step));

  req.logOperation(reviewer_id || 1, 'claim', 'create', info.lastInsertRowid, `创建理赔: ${claim_no}`);

  const claim = req.db.prepare('SELECT * FROM claims WHERE id = ?').get(info.lastInsertRowid);
  res.json(claim);
});

router.post('/:id/approve', (req, res) => {
  const claim = req.db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: '理赔记录不存在' });

  const { approver_id, approver_role, approval_opinion } = req.body;

  if (!approver_role) {
    return res.status(400).json({ error: '缺少审批角色' });
  }

  const approval = req.db.prepare(`
    SELECT * FROM claim_approvals 
    WHERE claim_id = ? AND approver_role = ? AND approval_status = 'pending'
    ORDER BY step LIMIT 1
  `).get(req.params.id, approver_role);

  if (!approval) {
    return res.status(400).json({ error: '当前角色无待审批事项或已审批' });
  }

  req.db.prepare(`
    UPDATE claim_approvals SET
      approver_id = ?,
      approval_status = 'approved',
      approval_opinion = ?,
      approval_time = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approver_id, approval_opinion, approval.id);

  const pendingCount = req.db.prepare(`
    SELECT COUNT(*) as count FROM claim_approvals 
    WHERE claim_id = ? AND approval_status = 'pending'
  `).get(req.params.id).count;

  if (pendingCount === 0) {
    req.db.prepare(`
      UPDATE claims SET 
        status = 'approved', 
        review_opinion = COALESCE(?, review_opinion),
        reviewer_id = COALESCE(?, reviewer_id),
        review_time = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(approval_opinion, approver_id, req.params.id);

    req.db.prepare(`UPDATE reports SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(claim.report_id);
  } else {
    req.db.prepare(`UPDATE claims SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);
  }

  req.logOperation(approver_id || 1, 'claim', 'approve', req.params.id, `审批通过: ${claim.claim_no}, 角色: ${approver_role}`);

  const updated = req.db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/reject', (req, res) => {
  const claim = req.db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: '理赔记录不存在' });

  const { approver_id, approver_role, rejection_reason, approval_opinion } = req.body;

  if (!approver_role || !rejection_reason) {
    return res.status(400).json({ error: '缺少审批角色或拒赔原因' });
  }

  req.db.prepare(`
    UPDATE claim_approvals SET
      approver_id = ?,
      approval_status = 'rejected',
      approval_opinion = ?,
      approval_time = CURRENT_TIMESTAMP
    WHERE claim_id = ? AND approver_role = ?
  `).run(approver_id, approval_opinion, req.params.id, approver_role);

  req.db.prepare(`
    UPDATE claims SET 
      status = 'rejected', 
      rejection_reason = ?,
      review_opinion = ?,
      reviewer_id = COALESCE(?, reviewer_id),
      review_time = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(rejection_reason, approval_opinion, approver_id, req.params.id);

  req.db.prepare(`UPDATE reports SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(claim.report_id);
  req.logOperation(approver_id || 1, 'claim', 'reject', req.params.id, `拒赔: ${claim.claim_no}, 原因: ${rejection_reason}`);

  const updated = req.db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/pay', (req, res) => {
  const claim = req.db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: '理赔记录不存在' });
  if (claim.status !== 'approved') return res.status(400).json({ error: '理赔未通过审批' });

  req.db.prepare(`
    UPDATE claims SET status = 'paid', payment_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);

  req.db.prepare(`UPDATE reports SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(claim.report_id);
  req.logOperation(1, 'claim', 'pay', req.params.id, `赔付完成: ${claim.claim_no}, 金额: ${claim.compensation_amount}`);

  const updated = req.db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
