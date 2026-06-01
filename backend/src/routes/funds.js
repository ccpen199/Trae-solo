const express = require('express');
const db = require('../database');
const { authMiddleware, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/:club_id', authMiddleware, (req, res) => {
  const fund = db.prepare('SELECT * FROM funds WHERE club_id = ?').get(req.params.club_id);
  if (!fund) {
    return res.status(404).json({ error: '账户不存在' });
  }
  res.json(fund);
});

router.get('/:club_id/applications', authMiddleware, (req, res) => {
  const applications = db.prepare(`
    SELECT fa.*, a.title as activity_title, u.name as approver_name
    FROM fund_applications fa
    LEFT JOIN activities a ON fa.activity_id = a.id
    LEFT JOIN users u ON fa.approver_id = u.id
    WHERE fa.club_id = ?
    ORDER BY fa.created_at DESC
  `).all(req.params.club_id);
  res.json(applications);
});

router.post('/applications', authMiddleware, (req, res) => {
  const { club_id, activity_id, title, amount, purpose } = req.body;
  
  const isLeader = db.prepare(`
    SELECT 1 FROM club_members 
    WHERE club_id = ? AND user_id = ? AND role = 'leader'
  `).get(club_id, req.user.id);
  
  const isAdmin = req.user.role === 'admin';
  
  if (!isLeader && !isAdmin) {
    return res.status(403).json({ error: '只有社团负责人可以申请经费' });
  }

  const fund = db.prepare('SELECT balance FROM funds WHERE club_id = ?').get(club_id);
  if (fund && parseFloat(amount) > fund.balance * 1.5) {
    return res.status(400).json({ error: '申请金额超过预算上限（余额的150%）' });
  }

  const result = db.prepare(`
    INSERT INTO fund_applications (club_id, activity_id, title, amount, purpose, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(club_id, activity_id, title, amount, purpose);

  res.json({ id: result.lastInsertRowid, message: '经费申请已提交' });
});

router.put('/applications/:id/approve', authMiddleware, requireRoles('admin'), (req, res) => {
  const { status, approval_note } = req.body;
  const applicationId = req.params.id;
  
  const application = db.prepare('SELECT * FROM fund_applications WHERE id = ?').get(applicationId);
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }

  if (status === 'approved') {
    const fund = db.prepare('SELECT balance FROM funds WHERE club_id = ?').get(application.club_id);
    if (fund && parseFloat(application.amount) > fund.balance) {
      return res.status(400).json({ error: '社团经费余额不足' });
    }
  }

  db.prepare(`
    UPDATE fund_applications 
    SET status = ?, approval_note = ?, approver_id = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, approval_note, req.user.id, applicationId);

  res.json({ 
    message: status === 'approved' ? '经费申请已通过' : '经费申请已驳回' 
  });
});

router.put('/applications/:id/reimburse', authMiddleware, requireRoles('admin'), (req, res) => {
  const { receipts } = req.body;
  const applicationId = req.params.id;
  
  const application = db.prepare('SELECT * FROM fund_applications WHERE id = ?').get(applicationId);
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  if (application.status !== 'approved') {
    return res.status(400).json({ error: '申请未通过审批' });
  }
  
  if (!receipts) {
    return res.status(400).json({ error: '缺少票据信息' });
  }

  db.prepare(`
    UPDATE fund_applications 
    SET status = 'reimbursed', receipts = ?, reimbursed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(receipts, applicationId);

  db.prepare(`
    UPDATE funds 
    SET balance = balance - ?, total_expense = total_expense + ?, updated_at = CURRENT_TIMESTAMP
    WHERE club_id = ?
  `).run(application.amount, application.amount, application.club_id);

  res.json({ message: '报销已完成' });
});

router.post('/:club_id/deposit', authMiddleware, requireRoles('admin'), (req, res) => {
  const { amount, note } = req.body;
  const clubId = req.params.club_id;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: '金额无效' });
  }

  db.prepare(`
    UPDATE funds 
    SET balance = balance + ?, total_income = total_income + ?, updated_at = CURRENT_TIMESTAMP
    WHERE club_id = ?
  `).run(amount, amount, clubId);

  res.json({ message: '充值成功' });
});

module.exports = router;
