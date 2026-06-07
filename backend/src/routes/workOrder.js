const express = require('express');
const { db } = require('../utils/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getServiceUserId } = require('../utils/accountContext');

const router = express.Router();

function generateOrderNo(type) {
  const prefix = { install: 'IN', repair: 'RP', inspect: 'IS', complaint: 'CP' }[type] || 'WO';
  const date = new Date();
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `${prefix}${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${random}`;
}

function getSlaDueTime(priority) {
  const hours = { urgent: 2, high: 8, medium: 24, normal: 24, low: 72 }[priority] || 24;
  const due = new Date();
  due.setHours(due.getHours() + hours);
  return due.toISOString();
}

function normalizeType(type) {
  return { maintain: 'repair', inspection: 'inspect', other: 'complaint' }[type] || type;
}

function normalizePriority(priority) {
  return { medium: 'normal' }[priority] || priority || 'normal';
}

router.post('/create', authenticateToken, (req, res) => {
  try {
    const { title, description, location, gps_coords } = req.body;
    const type = normalizeType(req.body.type);
    const priority = normalizePriority(req.body.priority);

    if (!type || !title) {
      return res.status(400).json({ error: '请填写工单类型和标题' });
    }

    const serviceUserId = getServiceUserId(req);
    const assignee = db.prepare(`
      SELECT id, real_name, org_id
      FROM users
      WHERE role = 'grid_worker' AND status = 'active'
      ORDER BY id
      LIMIT 1
    `).get();
    const order_no = generateOrderNo(type);
    const sla_due_time = getSlaDueTime(priority);
    const status = assignee ? 'assigned' : 'pending';

    const result = db.prepare(`INSERT INTO work_orders 
      (order_no, user_id, type, title, description, location, gps_coords, priority, status, assigned_to, assign_time, sla_due_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END, ?)`).run(
      order_no, serviceUserId, type, title, description, location, gps_coords, priority, status, assignee?.id || null, assignee?.id || null, sla_due_time
    );

    db.prepare(`INSERT INTO work_order_logs (order_id, operator_id, action, remark) 
      VALUES (?, ?, 'create', ?)`).run(result.lastInsertRowid, req.user.id, '用户提交工单');
    if (assignee) {
      db.prepare(`INSERT INTO work_order_logs (order_id, operator_id, action, remark)
        VALUES (?, ?, 'auto_assign', ?)`).run(
        result.lastInsertRowid,
        req.user.id,
        `系统按区域和工单类型自动派发给${assignee.real_name}`
      );
    }

    res.json({
      id: result.lastInsertRowid,
      order_no,
      type,
      priority,
      status,
      assigned_to: assignee?.id || null,
      assignee_name: assignee?.real_name || null,
      sla_due_time,
      location,
      title,
      contact_phone: req.user.phone,
      message: '工单提交成功'
    });
  } catch (err) {
    console.error('创建工单错误:', err);
    res.status(500).json({ error: '提交失败' });
  }
});

router.get('/my-orders', authenticateToken, (req, res) => {
  try {
    const { status, type, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE wo.user_id = ?';
    const params = [getServiceUserId(req)];
    if (['admin', 'operator'].includes(req.user.role)) {
      whereClause = 'WHERE 1 = 1';
      params.length = 0;
    } else if (req.user.role === 'grid_worker') {
      whereClause = 'WHERE wo.assigned_to = ?';
      params.length = 0;
      params.push(req.user.id);
    }

    if (status) {
      whereClause += ' AND wo.status = ?';
      params.push(status);
    }
    if (type) {
      whereClause += ' AND wo.type = ?';
      params.push(normalizeType(type));
    }

    const orders = db.prepare(`
      SELECT wo.*, assignee.real_name as assignee_name, owner.phone as contact_phone
      FROM work_orders wo 
      LEFT JOIN users assignee ON wo.assigned_to = assignee.id 
      LEFT JOIN users owner ON wo.user_id = owner.id
      ${whereClause} 
      ORDER BY wo.created_at DESC 
      LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM work_orders wo ${whereClause}`).get(...params).count;

    res.json({ list: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    console.error('获取工单错误:', err);
    res.status(500).json({ error: '获取工单失败' });
  }
});

router.get('/worker/my-tasks', authenticateToken, requireRole('grid_worker', 'operator', 'admin'), (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = req.user.role === 'admin' || req.user.role === 'operator' ? 'WHERE 1 = 1' : 'WHERE assigned_to = ?';
    const params = req.user.role === 'admin' || req.user.role === 'operator' ? [] : [req.user.id];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const orders = db.prepare(`
      SELECT wo.*, u.real_name as user_name, u.phone as user_phone
      FROM work_orders wo
      LEFT JOIN users u ON wo.user_id = u.id
      ${whereClause}
      ORDER BY
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          ELSE 4 END,
        wo.created_at DESC
      LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM work_orders ${whereClause}`).get(...params).count;

    res.json({ list: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: '获取任务失败' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const order = db.prepare(`
      SELECT wo.*, u.real_name as assignee_name, u2.real_name as user_name, u2.phone as user_phone 
      FROM work_orders wo 
      LEFT JOIN users u ON wo.assigned_to = u.id 
      LEFT JOIN users u2 ON wo.user_id = u2.id 
      WHERE wo.id = ?`).get(id);

    if (!order) {
      return res.status(404).json({ error: '工单不存在' });
    }

    if (order.user_id !== getServiceUserId(req) && !['admin', 'operator', 'grid_worker'].includes(req.user.role)) {
      return res.status(403).json({ error: '无权查看此工单' });
    }

    const logs = db.prepare(`
      SELECT wol.*, u.real_name as operator_name 
      FROM work_order_logs wol 
      LEFT JOIN users u ON wol.operator_id = u.id 
      WHERE wol.order_id = ? 
      ORDER BY wol.created_at ASC`).all(id);

    res.json({ order, logs });
  } catch (err) {
    res.status(500).json({ error: '获取工单详情失败' });
  }
});

router.put('/:id/rate', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    const order = db.prepare('SELECT * FROM work_orders WHERE id = ? AND user_id = ?').get(id, getServiceUserId(req));
    if (!order) {
      return res.status(404).json({ error: '工单不存在' });
    }
    if (order.status !== 'completed') {
      return res.status(400).json({ error: '只能评价已完成的工单' });
    }

    db.prepare('UPDATE work_orders SET rating = ?, review = ? WHERE id = ?').run(rating, review, id);

    db.prepare(`INSERT INTO work_order_logs (order_id, operator_id, action, remark) 
      VALUES (?, ?, 'review', ?)`).run(id, req.user.id, `用户评价：${rating}星 - ${review}`);

    res.json({ message: '评价成功' });
  } catch (err) {
    res.status(500).json({ error: '评价失败' });
  }
});

router.put('/:id/start', authenticateToken, requireRole('grid_worker', 'operator', 'admin'), (req, res) => {
  try {
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: '工单不存在' });
    }

    if (order.assigned_to !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权处理此工单' });
    }

    if (!['assigned', 'pending'].includes(order.status)) {
      return res.status(400).json({ error: '当前状态无法开始处理' });
    }

    db.prepare(`UPDATE work_orders SET status = 'processing', start_time = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
    db.prepare(`INSERT INTO work_order_logs (order_id, operator_id, action, remark) 
      VALUES (?, ?, 'start', '开始处理')`).run(id, req.user.id);

    res.json({ message: '已开始处理' });
  } catch (err) {
    res.status(500).json({ error: '操作失败' });
  }
});

router.put('/:id/complete', authenticateToken, requireRole('grid_worker', 'operator', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { result } = req.body;

    const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: '工单不存在' });
    }

    if (order.assigned_to !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权处理此工单' });
    }

    if (order.status !== 'processing') {
      return res.status(400).json({ error: '当前状态无法完成' });
    }

    db.prepare(`UPDATE work_orders SET status = 'completed', complete_time = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
    db.prepare(`INSERT INTO work_order_logs (order_id, operator_id, action, remark) 
      VALUES (?, ?, 'complete', ?)`).run(id, req.user.id, result || '处理完成');

    res.json({ message: '工单已完成' });
  } catch (err) {
    res.status(500).json({ error: '操作失败' });
  }
});

module.exports = router;
