const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/my', authenticate, (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = ['o.worker_id = ?'];
  let params = [req.user.id];
  
  if (status) {
    where.push('o.status = ?');
    params.push(status);
  }
  
  const whereClause = where.join(' AND ');
  
  const orders = db.prepare(`
    SELECT o.*, t.title, t.task_type, t.category, t.description as task_description,
           e.company_name
    FROM orders o
    JOIN tasks t ON o.task_id = t.id
    JOIN employers e ON o.employer_id = e.id
    WHERE ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM orders o WHERE ${whereClause}
  `).get(...params).count;
  
  res.json({
    data: orders,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/employer', authenticate, requireRole('employer'), (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  const employer = db.prepare('SELECT id FROM employers WHERE user_id = ?').get(req.user.id);
  
  let where = ['o.employer_id = ?'];
  let params = [employer.id];
  
  if (status) {
    where.push('o.status = ?');
    params.push(status);
  }
  
  const whereClause = where.join(' AND ');
  
  const orders = db.prepare(`
    SELECT o.*, t.title, t.task_type, t.category,
           u.username, u.real_name, u.phone
    FROM orders o
    JOIN tasks t ON o.task_id = t.id
    JOIN users u ON o.worker_id = u.id
    WHERE ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM orders o WHERE ${whereClause}
  `).get(...params).count;
  
  res.json({
    data: orders,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/:id', authenticate, (req, res) => {
  const order = db.prepare(`
    SELECT o.*, t.title, t.description as task_description, t.task_type, t.category,
           t.skills_required, t.location, t.budget, t.risk_level,
           e.company_name, e.contact_name, e.contact_phone,
           w.username as worker_username, w.real_name as worker_name, w.phone as worker_phone,
           w.location as worker_location
    FROM orders o
    JOIN tasks t ON o.task_id = t.id
    JOIN employers e ON o.employer_id = e.id
    JOIN users w ON o.worker_id = w.id
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.worker_id !== req.user.id && req.user.user_type !== 'admin') {
    const employer = db.prepare('SELECT id FROM employers WHERE user_id = ?').get(req.user.id);
    if (!employer || employer.id !== order.employer_id) {
      return res.status(403).json({ error: '无权查看此订单' });
    }
  }
  
  order.skills_required = order.skills_required ? JSON.parse(order.skills_required) : [];
  
  res.json(order);
});

router.post('/:id/start', authenticate, requireRole('student', 'homemaker', 'parttime'), (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.worker_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作此订单' });
  }
  
  if (order.status !== 'verified') {
    return res.status(400).json({ error: '订单状态不允许开始工作' });
  }
  
  db.prepare(`
    UPDATE orders SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);
  
  res.json({ message: '已开始工作' });
});

router.post('/:id/submit', authenticate, requireRole('student', 'homemaker', 'parttime'), (req, res) => {
  const { deliverable, deliverable_url } = req.body;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.worker_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作此订单' });
  }
  
  if (order.status !== 'in_progress') {
    return res.status(400).json({ error: '订单状态不允许提交' });
  }
  
  const spotCheck = Math.random() < 0.2 ? 1 : 0;
  
  db.prepare(`
    UPDATE orders SET 
      status = ?,
      deliverable = ?,
      deliverable_url = ?,
      submitted_at = CURRENT_TIMESTAMP,
      spot_check = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(spotCheck ? 'reviewing' : 'completed', deliverable || '', deliverable_url || '', spotCheck, req.params.id);
  
  if (!spotCheck) {
    const platformFee = order.amount * 0.05;
    const workerAmount = order.amount - platformFee;
    
    db.prepare(`
      INSERT INTO settlements (order_id, worker_id, employer_id, amount, platform_fee, worker_amount, status, settle_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, DATE('now', '+1 day'))
    `).run(order.id, order.worker_id, order.employer_id, order.amount, platformFee, workerAmount, 'pending');
    
    db.prepare(`
      UPDATE users SET credit_score = credit_score + 2 WHERE id = ?
    `).run(order.worker_id);
  }
  
  const employerUser = db.prepare(`
    SELECT u.id FROM users u
    JOIN employers e ON u.id = e.user_id
    WHERE e.id = ?
  `).get(order.employer_id);
  
  if (employerUser) {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(employerUser.id, 'order', '订单已提交', '有订单已提交，请查看', order.id);
  }
  
  if (spotCheck) {
    const admins = db.prepare("SELECT id FROM users WHERE user_type = 'admin'").all();
    admins.forEach(admin => {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, content, related_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(admin.id, 'review', '订单待抽检', `订单#${order.id}需要人工抽检`, order.id);
    });
  }
  
  res.json({ 
    message: spotCheck ? '提交成功，等待人工抽检' : '提交成功，等待结算',
    status: spotCheck ? 'reviewing' : 'completed'
  });
});

router.post('/:id/review', authenticate, (req, res) => {
  const { status, review_note } = req.body;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (req.user.user_type === 'employer') {
    const employer = db.prepare('SELECT id FROM employers WHERE user_id = ?').get(req.user.id);
    if (!employer || employer.id !== order.employer_id) {
      return res.status(403).json({ error: '无权审核此订单' });
    }
    if (order.status !== 'submitted' && order.status !== 'reviewing') {
      return res.status(400).json({ error: '订单状态不允许审核' });
    }
  } else if (req.user.user_type === 'admin') {
    if (order.status !== 'reviewing') {
      return res.status(400).json({ error: '订单状态不允许抽检' });
    }
  } else {
    return res.status(403).json({ error: '无审核权限' });
  }
  
  if (!['completed', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的审核状态' });
  }
  
  db.prepare(`
    UPDATE orders SET 
      status = ?,
      review_note = ?,
      reviewed_at = CURRENT_TIMESTAMP,
      spot_check_passed = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, review_note || '', status === 'completed' ? 1 : 0, req.params.id);
  
  if (status === 'completed') {
    const platformFee = order.amount * 0.05;
    const workerAmount = order.amount - platformFee;
    
    const existingSettlement = db.prepare('SELECT id FROM settlements WHERE order_id = ?').get(order.id);
    if (!existingSettlement) {
      db.prepare(`
        INSERT INTO settlements (order_id, worker_id, employer_id, amount, platform_fee, worker_amount, status, settle_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, DATE('now', '+1 day'))
      `).run(order.id, order.worker_id, order.employer_id, order.amount, platformFee, workerAmount, 'pending');
    }
    
    db.prepare(`
      UPDATE users SET credit_score = credit_score + 2 WHERE id = ?
    `).run(order.worker_id);
  } else {
    db.prepare(`
      UPDATE users SET credit_score = credit_score - 5 WHERE id = ?
    `).run(order.worker_id);
  }
  
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(order.worker_id, 'order', 
    status === 'completed' ? '订单审核通过' : '订单被驳回',
    review_note || (status === 'completed' ? '您的交付已通过审核' : '您的交付未通过审核，请重新提交'),
    order.id
  );
  
  res.json({ message: '审核完成' });
});

router.post('/:id/appeal', authenticate, (req, res) => {
  const { type, reason, evidence } = req.body;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.worker_id !== req.user.id) {
    const employer = db.prepare('SELECT id FROM employers WHERE user_id = ?').get(req.user.id);
    if (!employer || employer.id !== order.employer_id) {
      return res.status(403).json({ error: '无权申诉此订单' });
    }
  }
  
  if (!['completed', 'rejected'].includes(order.status)) {
    return res.status(400).json({ error: '订单状态不允许申诉' });
  }
  
  db.prepare(`
    UPDATE orders SET status = 'appealing', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);
  
  db.prepare(`
    INSERT INTO appeals (order_id, user_id, type, reason, evidence, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(order.id, req.user.id, type || 'other', reason, evidence || '');
  
  const admins = db.prepare("SELECT id FROM users WHERE user_type = 'admin'").all();
  admins.forEach(admin => {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(admin.id, 'appeal', '新的申诉待处理', `订单#${order.id}有新的申诉`, order.id);
  });
  
  res.json({ message: '申诉已提交，等待平台处理' });
});

module.exports = router;
