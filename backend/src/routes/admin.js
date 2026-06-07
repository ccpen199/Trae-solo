const express = require('express');
const { db } = require('../utils/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticateToken, requireRole('admin', 'operator'), (req, res) => {
  try {
    const stats = {
      total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      total_meters: db.prepare('SELECT COUNT(*) as count FROM meters').get().count,
      active_orders: db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE status IN ('pending','assigned','processing')").get().count,
      pending_bills: db.prepare("SELECT COUNT(*) as count FROM bills WHERE status IN ('unpaid','partial')").get().count,
      total_revenue_month: db.prepare(`
        SELECT COALESCE(SUM(pay_amount), 0) as total 
        FROM bills 
        WHERE status = 'paid' AND strftime('%Y-%m', pay_time) = strftime('%Y-%m', CURRENT_TIMESTAMP)`).get().total,
      new_users_month: db.prepare(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', CURRENT_TIMESTAMP)`).get().count,
      work_order_stats: db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM work_orders 
        GROUP BY status`).all(),
      order_type_stats: db.prepare(`
        SELECT type, COUNT(*) as count 
        FROM work_orders 
        GROUP BY type`).all(),
      recent_readings: db.prepare(`
        SELECT mr.*, u.real_name, m.meter_no 
        FROM meter_readings mr 
        LEFT JOIN users u ON mr.user_id = u.id 
        LEFT JOIN meters m ON mr.meter_id = m.id 
        ORDER BY mr.created_at DESC 
        LIMIT 10`).all(),
      recent_work_orders: db.prepare(`
        SELECT wo.*, u.real_name as user_name 
        FROM work_orders wo 
        LEFT JOIN users u ON wo.user_id = u.id 
        ORDER BY wo.created_at DESC 
        LIMIT 10`).all()
    };

    const slaStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' AND complete_time <= sla_due_time THEN 1 ELSE 0 END) as on_time,
        SUM(CASE WHEN status = 'completed' AND complete_time > sla_due_time THEN 1 ELSE 0 END) as overdue
      FROM work_orders 
      WHERE status = 'completed'`).get();

    stats.sla_compliance_rate = slaStats.total > 0 
      ? parseFloat(((slaStats.on_time / slaStats.total) * 100).toFixed(2)) 
      : 100;

    res.json(stats);
  } catch (err) {
    console.error('看板数据错误:', err);
    res.status(500).json({ error: '获取看板数据失败' });
  }
});

router.get('/stats', authenticateToken, requireRole('admin', 'operator'), (req, res) => {
  try {
    const stats = {
      total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      total_meters: db.prepare('SELECT COUNT(*) as count FROM meters').get().count,
      active_orders: db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE status IN ('pending','assigned','processing')").get().count,
      pending_bills: db.prepare("SELECT COUNT(*) as count FROM bills WHERE status IN ('unpaid','partial')").get().count,
      total_revenue_month: db.prepare(`
        SELECT COALESCE(SUM(pay_amount), 0) as total
        FROM bills
        WHERE status = 'paid' AND strftime('%Y-%m', pay_time) = strftime('%Y-%m', CURRENT_TIMESTAMP)`).get().total
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/organizations', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const orgs = db.prepare(`
      SELECT o1.*, o2.name as parent_name,
        (SELECT COUNT(*) FROM users u WHERE u.org_id = o1.id) as user_count
      FROM organizations o1 
      LEFT JOIN organizations o2 ON o1.parent_id = o2.id 
      ORDER BY o1.type, o1.id`).all();
    
    res.json({ list: orgs });
  } catch (err) {
    res.status(500).json({ error: '获取组织架构失败' });
  }
});

router.get('/users', authenticateToken, requireRole('admin', 'operator'), (req, res) => {
  try {
    const { role, status, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const users = db.prepare(`
      SELECT u.id, u.username, u.real_name, u.phone, u.email, u.role, u.status, 
             u.created_at, o.name as org_name, up.gas_user_no
      FROM users u 
      LEFT JOIN organizations o ON u.org_id = o.id 
      LEFT JOIN user_profiles up ON u.id = up.user_id 
      ${whereClause} 
      ORDER BY u.id DESC 
      LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params).count;

    res.json({ list: users, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

router.get('/work-orders', authenticateToken, requireRole('admin', 'operator'), (req, res) => {
  try {
    const { status, type, priority, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) { whereClause += ' AND wo.status = ?'; params.push(status); }
    if (type) { whereClause += ' AND wo.type = ?'; params.push(type); }
    if (priority) { whereClause += ' AND wo.priority = ?'; params.push(priority); }

    const orders = db.prepare(`
      SELECT wo.*, u.real_name as user_name, u.phone as user_phone, 
             u2.real_name as assignee_name,
             CASE WHEN wo.status IN ('completed','cancelled') THEN 0
                  WHEN datetime(CURRENT_TIMESTAMP) > wo.sla_due_time THEN 1
                  ELSE 0 END as is_overdue
      FROM work_orders wo 
      LEFT JOIN users u ON wo.user_id = u.id 
      LEFT JOIN users u2 ON wo.assigned_to = u2.id 
      ${whereClause} 
      ORDER BY 
        CASE wo.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
        wo.created_at DESC 
      LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM work_orders wo ${whereClause}`).get(...params).count;

    res.json({ list: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: '获取工单列表失败' });
  }
});

router.put('/work-orders/:id/assign', authenticateToken, requireRole('admin', 'operator'), (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: '工单不存在' });
    }

    db.prepare(`UPDATE work_orders SET 
      status = 'assigned', 
      assigned_to = ?, 
      assign_time = CURRENT_TIMESTAMP 
      WHERE id = ?`).run(assigned_to, id);

    db.prepare(`INSERT INTO work_order_logs (order_id, operator_id, action, remark) 
      VALUES (?, ?, 'assign', ?)`).run(id, req.user.id, `指派给用户ID: ${assigned_to}`);

    res.json({ message: '工单已指派' });
  } catch (err) {
    res.status(500).json({ error: '指派失败' });
  }
});

router.get('/sla-monitor', authenticateToken, requireRole('admin', 'operator'), (req, res) => {
  try {
    const slaData = db.prepare(`
      SELECT 
        wo.id, wo.order_no, wo.title, wo.type, wo.priority, wo.status,
        wo.created_at, wo.sla_due_time,
        u.real_name as user_name,
        u2.real_name as assignee_name,
        julianday(wo.sla_due_time) - julianday(CURRENT_TIMESTAMP) as hours_remaining,
        CASE 
          WHEN wo.status IN ('completed','cancelled') THEN 'closed'
          WHEN datetime(CURRENT_TIMESTAMP) > wo.sla_due_time THEN 'overdue'
          WHEN julianday(wo.sla_due_time) - julianday(CURRENT_TIMESTAMP) < 0.25 THEN 'warning'
          ELSE 'normal'
        END as sla_status
      FROM work_orders wo 
      LEFT JOIN users u ON wo.user_id = u.id 
      LEFT JOIN users u2 ON wo.assigned_to = u2.id 
      WHERE wo.status NOT IN ('completed','cancelled')
      ORDER BY 
        CASE sla_status WHEN 'overdue' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
        wo.sla_due_time ASC`).all();

    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_active,
        SUM(CASE WHEN datetime(CURRENT_TIMESTAMP) > sla_due_time THEN 1 ELSE 0 END) as overdue_count,
        SUM(CASE WHEN julianday(sla_due_time) - julianday(CURRENT_TIMESTAMP) < 0.25 
                  AND datetime(CURRENT_TIMESTAMP) <= sla_due_time THEN 1 ELSE 0 END) as warning_count
      FROM work_orders 
      WHERE status NOT IN ('completed','cancelled')`).get();

    res.json({ list: slaData, summary });
  } catch (err) {
    res.status(500).json({ error: '获取SLA监控失败' });
  }
});

router.get('/device-graph', authenticateToken, requireRole('admin', 'operator'), (req, res) => {
  try {
    const meters = db.prepare(`
      SELECT m.*, u.real_name as user_name, up.gas_user_no,
        (SELECT COUNT(*) FROM device_bindings WHERE parent_device_id = m.id) as child_count
      FROM meters m 
      LEFT JOIN users u ON m.user_id = u.id 
      LEFT JOIN user_profiles up ON u.id = up.user_id 
      ORDER BY m.id DESC 
      LIMIT 100`).all();

    const bindings = db.prepare(`
      SELECT db.*, p.meter_no as parent_no, c.meter_no as child_no 
      FROM device_bindings db 
      LEFT JOIN meters p ON db.parent_device_id = p.id 
      LEFT JOIN meters c ON db.child_device_id = c.id`).all();

    res.json({ meters, bindings });
  } catch (err) {
    res.status(500).json({ error: '获取设备图谱失败' });
  }
});

router.get('/meter-readings', authenticateToken, requireRole('admin', 'operator'), (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND mr.status = ?';
      params.push(status);
    }

    const readings = db.prepare(`
      SELECT mr.*, u.real_name, m.meter_no 
      FROM meter_readings mr 
      LEFT JOIN users u ON mr.user_id = u.id 
      LEFT JOIN meters m ON mr.meter_id = m.id 
      ${whereClause} 
      ORDER BY mr.created_at DESC 
      LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM meter_readings mr ${whereClause}`).get(...params).count;

    res.json({ 
      list: readings.map(r => ({ ...r, ocr_result: r.ocr_result ? JSON.parse(r.ocr_result) : null })), 
      total, 
      page: parseInt(page), 
      pageSize: parseInt(pageSize) 
    });
  } catch (err) {
    res.status(500).json({ error: '获取抄表记录失败' });
  }
});

router.put('/meter-readings/:id/verify', authenticateToken, requireRole('admin', 'operator'), (req, res) => {
  try {
    const { id } = req.params;
    const { status, reading_value } = req.body;

    db.prepare(`UPDATE meter_readings SET 
      status = ?, 
      reading_value = COALESCE(?, reading_value),
      verified_by = ?,
      verified_at = CURRENT_TIMESTAMP 
      WHERE id = ?`).run(status, reading_value, req.user.id, id);

    res.json({ message: '审核完成' });
  } catch (err) {
    res.status(500).json({ error: '审核失败' });
  }
});

router.get('/products', authenticateToken, requireRole('admin', 'operator'), (req, res) => {
  try {
    const { status, category, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) { whereClause += ' AND status = ?'; params.push(status); }
    if (category) { whereClause += ' AND category = ?'; params.push(category); }

    const products = db.prepare(`
      SELECT * FROM products 
      ${whereClause} 
      ORDER BY id DESC 
      LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM products ${whereClause}`).get(...params).count;

    res.json({ 
      list: products.map(p => ({ 
        ...p, 
        images: p.images ? JSON.parse(p.images) : [],
        specs: p.specs ? JSON.parse(p.specs) : {}
      })), 
      total, 
      page: parseInt(page), 
      pageSize: parseInt(pageSize) 
    });
  } catch (err) {
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

module.exports = router;
