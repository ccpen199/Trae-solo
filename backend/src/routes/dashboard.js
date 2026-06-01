const express = require('express');
const db = require('../config/database');

const router = express.Router();

router.get('/overview', (req, res) => {
  const totalFarmers = db.prepare("SELECT COUNT(*) as count FROM farmers WHERE status = 'active'").get().count;
  const totalCredit = db.prepare("SELECT SUM(approved_amount) as total FROM credit_approvals WHERE approval_status = 'approved'").get().total || 0;
  const usedCredit = db.prepare("SELECT SUM(used_amount) as total FROM credit_approvals WHERE approval_status = 'approved'").get().total || 0;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const totalRepayments = db.prepare('SELECT SUM(paid_amount) as total FROM repayments').get().total || 0;
  const overdueCount = db.prepare("SELECT COUNT(*) as count FROM repayments WHERE is_overdue = 1 AND status != 'paid'").get().count;
  const overdueAmount = db.prepare("SELECT SUM(remaining_amount) as total FROM repayments WHERE is_overdue = 1 AND status != 'paid'").get().total || 0;
  
  res.json({
    success: true,
    data: {
      totalFarmers,
      totalCredit,
      usedCredit,
      availableCredit: totalCredit - usedCredit,
      totalOrders,
      totalRepayments,
      overdueCount,
      overdueAmount,
      overdueRate: totalRepayments > 0 ? (overdueAmount / (totalRepayments + overdueAmount) * 100).toFixed(2) : 0
    }
  });
});

router.get('/overdue-farmers', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  const farmers = db.prepare(`
    SELECT f.id, f.name, f.phone, f.address, f.credit_score,
           COUNT(r.id) as overdue_count,
           SUM(r.remaining_amount) as overdue_amount,
           MAX(r.overdue_days) as max_overdue_days
    FROM farmers f
    INNER JOIN repayments r ON f.id = r.farmer_id
    WHERE r.is_overdue = 1 AND r.status != 'paid'
    GROUP BY f.id
    ORDER BY overdue_amount DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(DISTINCT f.id) as count
    FROM farmers f
    INNER JOIN repayments r ON f.id = r.farmer_id
    WHERE r.is_overdue = 1 AND r.status != 'paid'
  `).get().count;
  
  res.json({ success: true, data: farmers, total });
});

router.get('/store-risk', (req, res) => {
  const stores = db.prepare(`
    SELECT s.id, s.name, s.address,
           COUNT(o.id) as order_count,
           SUM(o.total_amount) as order_total,
           COUNT(CASE WHEN r.is_overdue = 1 THEN 1 END) as overdue_count,
           SUM(CASE WHEN r.is_overdue = 1 THEN r.remaining_amount ELSE 0 END) as overdue_amount
    FROM stores s
    LEFT JOIN orders o ON s.id = o.store_id
    LEFT JOIN repayments r ON o.id = r.order_id
    WHERE s.status = 'active'
    GROUP BY s.id
    ORDER BY overdue_amount DESC
  `).all();
  
  res.json({ success: true, data: stores });
});

router.get('/credit-usage', (req, res) => {
  const credits = db.prepare(`
    SELECT ca.id, f.name as farmer_name, ca.approved_amount, ca.used_amount, 
           ca.available_amount, ca.validity_end,
           ROUND(ca.used_amount * 100.0 / ca.approved_amount, 2) as usage_rate
    FROM credit_approvals ca
    LEFT JOIN farmers f ON ca.farmer_id = f.id
    WHERE ca.approval_status = 'approved' AND ca.approved_amount > 0
    ORDER BY usage_rate DESC
  `).all();
  
  res.json({ success: true, data: credits });
});

router.get('/crop-cycle-repayment', (req, res) => {
  const cycles = db.prepare(`
    SELECT 
      ca.crop_cycle,
      COUNT(DISTINCT o.id) as order_count,
      SUM(o.total_amount) as order_total,
      SUM(r.paid_amount) as paid_amount,
      SUM(r.remaining_amount) as remaining_amount
    FROM credit_approvals ca
    LEFT JOIN orders o ON ca.id = o.credit_approval_id
    LEFT JOIN repayments r ON o.id = r.order_id
    GROUP BY ca.crop_cycle
    ORDER BY ca.crop_cycle
  `).all();
  
  res.json({ success: true, data: cycles });
});

router.get('/bad-debt-trend', (req, res) => {
  const months = db.prepare(`
    SELECT 
      strftime('%Y-%m', due_date) as month,
      COUNT(*) as total_count,
      SUM(CASE WHEN is_overdue = 1 THEN 1 ELSE 0 END) as overdue_count,
      SUM(CASE WHEN is_overdue = 1 AND overdue_days > 90 THEN remaining_amount ELSE 0 END) as bad_debt_amount
    FROM repayments
    WHERE due_date >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', due_date)
    ORDER BY month
  `).all();
  
  res.json({ success: true, data: months });
});

router.get('/collection-tasks', (req, res) => {
  const { page = 1, pageSize = 20, status, assignee } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND ct.task_status = ?';
    params.push(status);
  }
  
  if (assignee) {
    whereClause += ' AND ct.assignee = ?';
    params.push(assignee);
  }
  
  const tasks = db.prepare(`
    SELECT ct.*, f.name as farmer_name, f.phone as farmer_phone,
           r.remaining_amount, r.overdue_days, r.due_date
    FROM collection_tasks ct
    LEFT JOIN farmers f ON ct.farmer_id = f.id
    LEFT JOIN repayments r ON ct.repayment_id = r.id
    WHERE ${whereClause}
    ORDER BY ct.priority = 'high' DESC, ct.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM collection_tasks ct WHERE ${whereClause}`).get(...params).count;
  
  res.json({ success: true, data: tasks, total });
});

router.post('/collection-tasks', (req, res) => {
  const { repayment_id, assignee, priority, notes } = req.body;
  
  const repayment = db.prepare('SELECT * FROM repayments WHERE id = ?').get(repayment_id);
  if (!repayment) {
    return res.status(404).json({ success: false, message: '还款记录不存在' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO collection_tasks (repayment_id, farmer_id, assignee, task_status, priority, notes)
    VALUES (?, ?, ?, 'pending', ?, ?)
  `);
  
  const result = stmt.run(repayment_id, repayment.farmer_id, assignee, priority || 'normal', notes);
  
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.put('/collection-tasks/:id', (req, res) => {
  const { task_status, last_contact_date, contact_result, next_followup_date, notes } = req.body;
  
  const task = db.prepare('SELECT * FROM collection_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: '催收任务不存在' });
  }
  
  db.prepare(`
    UPDATE collection_tasks SET
      task_status = COALESCE(?, task_status),
      last_contact_date = COALESCE(?, last_contact_date),
      contact_result = COALESCE(?, contact_result),
      next_followup_date = COALESCE(?, next_followup_date),
      notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(task_status, last_contact_date, contact_result, next_followup_date, notes, req.params.id);
  
  res.json({ success: true, message: '更新成功' });
});

router.get('/audit-logs', (req, res) => {
  const { page = 1, pageSize = 20, table_name, action } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '1=1';
  const params = [];
  
  if (table_name) {
    whereClause += ' AND table_name = ?';
    params.push(table_name);
  }
  
  if (action) {
    whereClause += ' AND action = ?';
    params.push(action);
  }
  
  const logs = db.prepare(`
    SELECT * FROM audit_logs
    WHERE ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM audit_logs WHERE ${whereClause}`).get(...params).count;
  
  res.json({ success: true, data: logs, total });
});

module.exports = router;
