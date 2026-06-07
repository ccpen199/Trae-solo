const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { auth, roleAuth, ROLES, ROLE_LABELS } = require('../middleware/auth');

const router = express.Router();

const ORDER_TYPES = {
  install: { label: '安装服务', icon: '🔧' },
  repair: { label: '维修服务', icon: '🔨' },
  maintenance: { label: '保养服务', icon: '🛠️' },
  return: { label: '退换货', icon: '📦' },
};

router.get('/', auth, (req, res) => {
  try {
    const db = getDb();
    const { status, type } = req.query;

    let where = [];
    let params = [];

    if (req.user.role === ROLES.FAMILY) {
      where.push('user_id = ?');
      params.push(req.user.id);
    } else if (req.user.role === ROLES.MAINTENANCE) {
      where.push('maintenance_id = ?');
      params.push(req.user.id);
    }

    if (status) { where.push('status = ?'); params.push(status); }
    if (type) { where.push('type = ?'); params.push(type); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const orders = db.prepare(
      `SELECT so.*, u.nickname as user_name, u.phone as user_phone,
       m.nickname as maintenance_name, d.name as device_name
       FROM service_orders so
       LEFT JOIN users u ON so.user_id = u.id
       LEFT JOIN users m ON so.maintenance_id = m.id
       LEFT JOIN devices d ON so.device_id = d.id
       ${whereClause}
       ORDER BY so.created_at DESC`
    ).all(...params);

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: '获取工单列表失败' });
  }
});

router.post('/', auth, roleAuth(ROLES.FAMILY, ROLES.ADMIN), (req, res) => {
  try {
    const { type, title, description, device_id, appointment_time, address, contact_name, contact_phone } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: '服务类型和标题必填' });
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO service_orders (id, user_id, type, title, description, device_id, 
       appointment_time, address, contact_name, contact_phone, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.user.id, type, title, description, device_id || null,
         appointment_time || null, address || null, contact_name || null, contact_phone || null,
         'pending', now, now);

    res.status(201).json({
      order_id: id,
      message: '工单已提交，我们会尽快安排工程师联系您'
    });
  } catch (err) {
    res.status(500).json({ error: '提交失败' });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare(
      `SELECT so.*, u.nickname as user_name, u.phone as user_phone,
       m.nickname as maintenance_name, d.name as device_name
       FROM service_orders so
       LEFT JOIN users u ON so.user_id = u.id
       LEFT JOIN users m ON so.maintenance_id = m.id
       LEFT JOIN devices d ON so.device_id = d.id
       WHERE so.id = ?`
    ).get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '工单不存在' });
    }

    if (req.user.role === ROLES.FAMILY && order.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权查看此工单' });
    }
    if (req.user.role === ROLES.MAINTENANCE && order.maintenance_id !== req.user.id) {
      return res.status(403).json({ error: '无权查看此工单' });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: '获取工单详情失败' });
  }
});

router.put('/:id/assign', auth, roleAuth(ROLES.ADMIN), (req, res) => {
  try {
    const { maintenance_id } = req.body;
    if (!maintenance_id) {
      return res.status(400).json({ error: '维修人员ID必填' });
    }

    const db = getDb();
    const now = new Date().toISOString();

    const result = db.prepare(
      'UPDATE service_orders SET maintenance_id = ?, status = ?, updated_at = ? WHERE id = ?'
    ).run(maintenance_id, 'assigned', now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '工单不存在' });
    }

    res.json({ message: '工单已分配' });
  } catch (err) {
    res.status(500).json({ error: '分配失败' });
  }
});

router.put('/:id/status', auth, (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: '状态必填' });
    }

    const db = getDb();
    const order = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '工单不存在' });
    }

    if (req.user.role === ROLES.MAINTENANCE && order.maintenance_id !== req.user.id) {
      return res.status(403).json({ error: '无权操作此工单' });
    }
    if (req.user.role === ROLES.FAMILY && order.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权操作此工单' });
    }

    const now = new Date().toISOString();
    db.prepare(
      'UPDATE service_orders SET status = ?, updated_at = ? WHERE id = ?'
    ).run(status, now, req.params.id);

    res.json({ message: '状态已更新' });
  } catch (err) {
    res.status(500).json({ error: '更新失败' });
  }
});

router.put('/:id/rate', auth, roleAuth(ROLES.FAMILY), (req, res) => {
  try {
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: '评分必须是1-5分' });
    }

    const db = getDb();
    const now = new Date().toISOString();

    const result = db.prepare(
      'UPDATE service_orders SET rating = ?, feedback = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).run(rating, feedback || null, now, req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '工单不存在或无权操作' });
    }

    res.json({ message: '评价已提交' });
  } catch (err) {
    res.status(500).json({ error: '提交失败' });
  }
});

router.get('/maintenance/list', auth, roleAuth(ROLES.ADMIN), (req, res) => {
  try {
    const db = getDb();
    const maintenance = db.prepare(
      "SELECT id, nickname, phone, real_name FROM users WHERE role = 'maintenance'"
    ).all();

    res.json({ maintenance });
  } catch (err) {
    res.status(500).json({ error: '获取维修人员列表失败' });
  }
});

module.exports = router;
