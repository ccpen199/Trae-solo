const express = require('express');
const { db } = require('../database');

const router = express.Router();

const APPROVAL_STATUSES = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  paid: '已支付'
};

const RESPONSIBLE_PARTIES = [
  '航空公司',
  '地服公司',
  '安检部门',
  '中转服务',
  '机场管理',
  '第三方物流',
  '旅客责任'
];

const COMPENSATION_STANDARDS = [
  '国内航线：每公斤100元',
  '国际航线：每公斤30美元',
  '贵重物品：另行协商',
  '破损修复：按实际费用',
  '遗失全赔：按重量计算',
  '延误赔偿：按天数计算'
];

router.post('/', (req, res) => {
  const {
    inquiry_no,
    responsible_party,
    compensation_standard,
    amount,
    applicant,
    remark
  } = req.body;

  if (!inquiry_no || !responsible_party || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields: inquiry_no, responsible_party, amount' });
  }

  if (!RESPONSIBLE_PARTIES.includes(responsible_party)) {
    return res.status(400).json({ error: 'Invalid responsible_party' });
  }

  const exception = db.prepare('SELECT * FROM baggage_exceptions WHERE inquiry_no = ?').get(inquiry_no);
  if (!exception) {
    return res.status(404).json({ error: 'Exception not found' });
  }

  const existing = db.prepare('SELECT * FROM compensation_records WHERE exception_id = ?').get(exception.id);
  if (existing) {
    return res.status(409).json({ error: 'Compensation record already exists for this exception', existing });
  }

  const stmt = db.prepare(`
    INSERT INTO compensation_records (
      exception_id, responsible_party, compensation_standard,
      amount, applicant, approval_status
    ) VALUES (?, ?, ?, ?, ?, 'pending')
  `);

  const result = stmt.run(
    exception.id,
    responsible_party,
    compensation_standard || '',
    parseFloat(amount) || 0,
    applicant || ''
  );

  const progressStmt = db.prepare(`
    INSERT INTO progress_records (exception_id, status, operator, remark)
    VALUES (?, 'open', ?, ?)
  `);
  progressStmt.run(exception.id, applicant || 'system', `已提交赔付申请，金额：${amount}元，责任方：${responsible_party}`);

  const record = db.prepare('SELECT * FROM compensation_records WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(record);
});

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, approval_status, responsible_party, inquiry_no } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClauses = ['1=1'];
  let params = [];

  if (approval_status) {
    whereClauses.push('cr.approval_status = ?');
    params.push(approval_status);
  }
  if (responsible_party) {
    whereClauses.push('cr.responsible_party = ?');
    params.push(responsible_party);
  }
  if (inquiry_no) {
    whereClauses.push('be.inquiry_no LIKE ?');
    params.push(`%${inquiry_no}%`);
  }

  const whereSql = whereClauses.join(' AND ');

  const total = db.prepare(`
    SELECT COUNT(*) as count 
    FROM compensation_records cr
    LEFT JOIN baggage_exceptions be ON cr.exception_id = be.id
    WHERE ${whereSql}
  `).get(...params);

  const list = db.prepare(`
    SELECT cr.*, be.inquiry_no, be.exception_type, be.exception_name,
           b.baggage_tag, b.passenger_name, b.flight_no
    FROM compensation_records cr
    LEFT JOIN baggage_exceptions be ON cr.exception_id = be.id
    LEFT JOIN baggage b ON be.baggage_id = b.id
    WHERE ${whereSql}
    ORDER BY cr.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), parseInt(offset));

  res.json({
    list,
    total: total.count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const record = db.prepare(`
    SELECT cr.*, be.inquiry_no, be.exception_type, be.exception_name, be.description,
           b.baggage_tag, b.passenger_name, b.passenger_phone, b.flight_no,
           b.flight_date, b.departure, b.destination, b.pieces, b.weight
    FROM compensation_records cr
    LEFT JOIN baggage_exceptions be ON cr.exception_id = be.id
    LEFT JOIN baggage b ON be.baggage_id = b.id
    WHERE cr.id = ?
  `).get(id);

  if (!record) {
    return res.status(404).json({ error: 'Compensation record not found' });
  }

  res.json(record);
});

router.put('/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approver, close_reason } = req.body;

  const record = db.prepare('SELECT * FROM compensation_records WHERE id = ?').get(id);
  if (!record) {
    return res.status(404).json({ error: 'Compensation record not found' });
  }

  db.prepare(`
    UPDATE compensation_records 
    SET approval_status = 'approved', approver = ?, approval_time = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approver || 'system', id);

  db.prepare(`
    INSERT INTO progress_records (exception_id, status, operator, remark)
    VALUES (?, 'in_progress', ?, ?)
  `).run(record.exception_id, approver || 'system', `赔付已批准，金额：${record.amount}元`);

  const updated = db.prepare('SELECT * FROM compensation_records WHERE id = ?').get(id);
  res.json(updated);
});

router.put('/:id/reject', (req, res) => {
  const { id } = req.params;
  const { approver, close_reason } = req.body;

  const record = db.prepare('SELECT * FROM compensation_records WHERE id = ?').get(id);
  if (!record) {
    return res.status(404).json({ error: 'Compensation record not found' });
  }

  db.prepare(`
    UPDATE compensation_records 
    SET approval_status = 'rejected', approver = ?, close_reason = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approver || 'system', close_reason || '', id);

  db.prepare(`
    INSERT INTO progress_records (exception_id, status, operator, remark)
    VALUES (?, 'in_progress', ?, ?)
  `).run(record.exception_id, approver || 'system', `赔付申请已拒绝，原因：${close_reason || '未说明'}`);

  const updated = db.prepare('SELECT * FROM compensation_records WHERE id = ?').get(id);
  res.json(updated);
});

router.put('/:id/close', (req, res) => {
  const { id } = req.params;
  const { approver, close_reason } = req.body;

  const record = db.prepare('SELECT * FROM compensation_records WHERE id = ?').get(id);
  if (!record) {
    return res.status(404).json({ error: 'Compensation record not found' });
  }

  db.prepare(`
    UPDATE compensation_records 
    SET approval_status = 'paid', approver = ?, close_reason = ?,
        closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approver || 'system', close_reason || '', id);

  db.prepare(`
    INSERT INTO progress_records (exception_id, status, operator, remark)
    VALUES (?, 'resolved', ?, ?)
  `).run(record.exception_id, approver || 'system', `赔付已完成并结案，金额：${record.amount}元`);

  const updated = db.prepare('SELECT * FROM compensation_records WHERE id = ?').get(id);
  res.json(updated);
});

router.get('/meta/responsible-parties', (req, res) => {
  res.json(RESPONSIBLE_PARTIES.map(p => ({ value: p, label: p })));
});

router.get('/meta/standards', (req, res) => {
  res.json(COMPENSATION_STANDARDS.map(s => ({ value: s, label: s })));
});

router.get('/meta/statuses', (req, res) => {
  res.json(
    Object.entries(APPROVAL_STATUSES).map(([type, name]) => ({ type, name }))
  );
});

module.exports = router;
