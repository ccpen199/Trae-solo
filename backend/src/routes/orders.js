const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();
const BATCH_SIZE = parseInt(process.env.ORDER_BATCH_SIZE) || 10;
const SESSION_MINUTES = parseInt(process.env.SESSION_DURATION_MINUTES) || 30;

const getFilteredOrdersQuery = (user, includeLocked = false) => {
  let baseQuery = `
    SELECT o.*,
           dc.name as dc_name,
           w.name as warehouse_name,
           b.name as branch_name
    FROM orders o
    LEFT JOIN distribution_centers dc ON o.distribution_center_id = dc.id
    LEFT JOIN warehouses w ON o.warehouse_id = w.id
    LEFT JOIN branches b ON o.branch_id = b.id
    WHERE o.is_self_pickup = 0
      AND o.is_same_day = 0
      AND o.has_timing_calculated = 1
      AND o.calendar_consistent = 1
      AND o.is_scheduled = 0
  `;

  const params = [];

  if (!user.isHeadquarters) {
    baseQuery += ` AND o.branch_id = ?`;
    params.push(user.branchId);
  }

  baseQuery += `
    AND EXISTS (
      SELECT 1 FROM scheduling_configs sc
      WHERE sc.status = 1
        AND sc.distribution_center_id = o.distribution_center_id
        AND sc.warehouse_id = o.warehouse_id
        AND sc.order_type = o.order_type
        AND (sc.min_items IS NULL OR o.item_count >= sc.min_items)
        AND (sc.max_items IS NULL OR o.item_count <= sc.max_items)
        AND (sc.min_volume IS NULL OR o.volume >= sc.min_volume)
        AND (sc.max_volume IS NULL OR o.volume <= sc.max_volume)
        AND (sc.min_weight IS NULL OR o.weight >= sc.min_weight)
        AND (sc.max_weight IS NULL OR o.weight <= sc.max_weight)
    )
  `;

  if (!includeLocked) {
    const now = new Date().toISOString();
    baseQuery += `
      AND o.id NOT IN (
        SELECT order_id FROM order_locks 
        WHERE status = 'active' AND expires_at > ?
      )
    `;
    params.push(now);
  }

  return { query: baseQuery, params };
};

router.get('/pending', authMiddleware, checkPermission(['scheduler', 'admin']), (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  const { query, params } = getFilteredOrdersQuery(req.user, false);

  const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
  const { total } = db.prepare(countQuery).get(...params);

  const ordersQuery = query + ` ORDER BY o.id LIMIT ? OFFSET ?`;
  const orders = db.prepare(ordersQuery).all(...params, parseInt(pageSize), offset);

  res.json({
    orders,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

router.get('/my-locked', authMiddleware, checkPermission(['scheduler', 'admin']), (req, res) => {
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE order_locks 
    SET status = 'expired' 
    WHERE user_id = ? AND status = 'active' AND expires_at < ?
  `).run(req.user.id, now);

  const locks = db.prepare(`
    SELECT ol.*, o.order_no, o.order_type,
           o.receiver_name, o.receiver_phone, o.receiver_landline,
           o.appointment_date, o.appointment_time,
           o.item_count, o.volume, o.weight,
           dc.name as dc_name, w.name as warehouse_name
    FROM order_locks ol
    JOIN orders o ON ol.order_id = o.id
    LEFT JOIN distribution_centers dc ON o.distribution_center_id = dc.id
    LEFT JOIN warehouses w ON o.warehouse_id = w.id
    WHERE ol.user_id = ? AND ol.status = 'active'
    ORDER BY ol.locked_at
  `).all(req.user.id);

  res.json({ lockedOrders: locks });
});

router.post('/claim', authMiddleware, checkPermission(['scheduler', 'admin']), (req, res) => {
  const existingLocks = db.prepare(`
    SELECT COUNT(*) as count FROM order_locks 
    WHERE user_id = ? AND status = 'active'
  `).get(req.user.id);

  if (existingLocks.count > 0) {
    return res.status(400).json({ 
      error: '您还有未处理完的订单，请先完成当前批次' 
    });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MINUTES * 60 * 1000);
  const batchId = uuidv4();

  const { query, params } = getFilteredOrdersQuery(req.user, false);
  const limitQuery = query + ` ORDER BY o.id LIMIT ?`;
  const availableOrders = db.prepare(limitQuery).all(...params, BATCH_SIZE);

  if (availableOrders.length === 0) {
    return res.json({ 
      batchId: null, 
      orders: [], 
      message: '当前没有可领取的订单' 
    });
  }

  const insertLock = db.prepare(`
    INSERT INTO order_locks (order_id, user_id, batch_id, locked_at, expires_at, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);

  const lockedOrders = [];
  const lockedOrderIds = [];

  for (const order of availableOrders) {
    try {
      const result = insertLock.run(
        order.id,
        req.user.id,
        batchId,
        now.toISOString(),
        expiresAt.toISOString()
      );
      lockedOrderIds.push(order.id);
      lockedOrders.push({
        ...order,
        lockId: result.lastInsertRowid,
        lockedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        batchId
      });
    } catch (err) {
      continue;
    }
  }

  if (lockedOrders.length === 0) {
    return res.json({ 
      batchId: null, 
      orders: [], 
      message: '订单已被其他调度员领取' 
    });
  }

  res.json({
    batchId,
    orders: lockedOrders,
    sessionDuration: SESSION_MINUTES,
    warningMinutes: parseInt(process.env.WARNING_MINUTES) || 25
  });
});

router.post('/:id/release', authMiddleware, checkPermission(['scheduler', 'admin']), (req, res) => {
  const orderId = parseInt(req.params.id);

  const lock = db.prepare(`
    SELECT * FROM order_locks 
    WHERE order_id = ? AND user_id = ? AND status = 'active'
  `).get(orderId, req.user.id);

  if (!lock) {
    return res.status(404).json({ error: '未找到该订单的锁定记录' });
  }

  db.prepare(`
    UPDATE order_locks SET status = 'released' WHERE id = ?
  `).run(lock.id);

  db.prepare(`
    INSERT INTO scheduling_records (
      order_id, user_id, batch_id, action, created_at
    ) VALUES (?, ?, ?, 'released', datetime('now'))
  `).run(orderId, req.user.id, lock.batch_id);

  res.json({ message: '订单已释放' });
});

router.put('/:id', authMiddleware, checkPermission(['scheduler', 'admin']), (req, res) => {
  const orderId = parseInt(req.params.id);
  const {
    receiverName,
    receiverPhone,
    receiverLandline,
    appointmentDate,
    appointmentTime,
    exceptionRemark
  } = req.body;

  const lock = db.prepare(`
    SELECT * FROM order_locks 
    WHERE order_id = ? AND user_id = ? AND status = 'active'
  `).get(orderId, req.user.id);

  if (!lock) {
    return res.status(404).json({ error: '未找到该订单的锁定记录或已过期' });
  }

  const now = new Date().toISOString();
  if (lock.expires_at < now) {
    db.prepare(`UPDATE order_locks SET status = 'expired' WHERE id = ?`).run(lock.id);
    return res.status(400).json({ error: '会话已过期，订单已释放' });
  }

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);

  const updates = [];
  const values = [];

  if (receiverName !== undefined) {
    updates.push('receiver_name = ?');
    values.push(receiverName);
  }
  if (receiverPhone !== undefined) {
    updates.push('receiver_phone = ?');
    values.push(receiverPhone);
  }
  if (receiverLandline !== undefined) {
    updates.push('receiver_landline = ?');
    values.push(receiverLandline);
  }
  if (appointmentDate !== undefined) {
    updates.push('appointment_date = ?');
    values.push(appointmentDate);
  }
  if (appointmentTime !== undefined) {
    updates.push('appointment_time = ?');
    values.push(appointmentTime);
  }

  if (updates.length > 0) {
    updates.push('updated_at = datetime("now")');
    values.push(orderId);

    db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    db.prepare(`
      INSERT INTO scheduling_records (
        order_id, user_id, batch_id, action,
        old_receiver_name, new_receiver_name,
        old_receiver_phone, new_receiver_phone,
        old_receiver_landline, new_receiver_landline,
        old_appointment_date, new_appointment_date,
        old_appointment_time, new_appointment_time,
        exception_remark
      ) VALUES (?, ?, ?, 'modified', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId, req.user.id, lock.batch_id,
      order.receiver_name, receiverName,
      order.receiver_phone, receiverPhone,
      order.receiver_landline, receiverLandline,
      order.appointment_date, appointmentDate,
      order.appointment_time, appointmentTime,
      exceptionRemark
    );
  }

  res.json({ message: '订单信息已更新' });
});

router.post('/:id/confirm', authMiddleware, checkPermission(['scheduler', 'admin']), (req, res) => {
  const orderId = parseInt(req.params.id);
  const { confirmResult, exceptionRemark } = req.body;

  const lock = db.prepare(`
    SELECT * FROM order_locks 
    WHERE order_id = ? AND user_id = ? AND status = 'active'
  `).get(orderId, req.user.id);

  if (!lock) {
    return res.status(404).json({ error: '未找到该订单的锁定记录' });
  }

  const now = new Date().toISOString();
  if (lock.expires_at < now) {
    db.prepare(`UPDATE order_locks SET status = 'expired' WHERE id = ?`).run(lock.id);
    return res.status(400).json({ error: '会话已过期' });
  }

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);

  if (confirmResult === 'confirmed') {
    db.prepare(`
      UPDATE orders SET is_scheduled = 1, updated_at = datetime("now") WHERE id = ?
    `).run(orderId);

    db.prepare(`
      UPDATE order_locks SET status = 'completed' WHERE id = ?
    `).run(lock.id);

    db.prepare(`
      INSERT INTO scheduling_records (
        order_id, user_id, batch_id, action,
        old_receiver_name, new_receiver_name,
        old_receiver_phone, new_receiver_phone,
        old_receiver_landline, new_receiver_landline,
        old_appointment_date, new_appointment_date,
        old_appointment_time, new_appointment_time,
        exception_remark
      ) VALUES (?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId, req.user.id, lock.batch_id,
      order.receiver_name, order.receiver_name,
      order.receiver_phone, order.receiver_phone,
      order.receiver_landline, order.receiver_landline,
      order.appointment_date, order.appointment_date,
      order.appointment_time, order.appointment_time,
      exceptionRemark
    );

    res.json({ message: '订单已确认调度完成' });
  } else if (confirmResult === 'cancelled') {
    db.prepare(`
      UPDATE orders 
      SET order_status = 'cancelled', updated_at = datetime("now") 
      WHERE id = ?
    `).run(orderId);

    db.prepare(`
      UPDATE order_locks SET status = 'cancelled' WHERE id = ?
    `).run(lock.id);

    db.prepare(`
      INSERT INTO scheduling_records (
        order_id, user_id, batch_id, action, exception_remark
      ) VALUES (?, ?, ?, 'cancelled', ?)
    `).run(orderId, req.user.id, lock.batch_id, '订单多维度调度系统与客户确认取消订单');

    if (order.receiver_phone) {
      const existingReject = db.prepare(`
        SELECT * FROM malicious_rejects WHERE receiver_phone = ?
      `).get(order.receiver_phone);

      if (existingReject) {
        db.prepare(`
          UPDATE malicious_rejects 
          SET reject_count = reject_count + 1, last_reject_at = datetime('now')
          WHERE id = ?
        `).run(existingReject.id);
      } else {
        db.prepare(`
          INSERT INTO malicious_rejects (receiver_phone, reject_count)
          VALUES (?, 1)
        `).run(order.receiver_phone);
      }
    }

    res.json({ message: '订单已取消，已记录恶意拒收线索' });
  } else {
    res.status(400).json({ error: '无效的确认结果' });
  }
});

router.get('/stats', authMiddleware, checkPermission(['admin', 'viewer']), (req, res) => {
  const { startDate, endDate, branchId } = req.query;

  let conditions = ['1=1'];
  let params = [];

  if (startDate) {
    conditions.push(`date(sr.created_at) >= ?`);
    params.push(startDate);
  }
  if (endDate) {
    conditions.push(`date(sr.created_at) <= ?`);
    params.push(endDate);
  }
  if (!req.user.isHeadquarters) {
    conditions.push(`o.branch_id = ?`);
    params.push(req.user.branchId);
  } else if (branchId) {
    conditions.push(`o.branch_id = ?`);
    params.push(parseInt(branchId));
  }

  const conditionStr = conditions.join(' AND ');

  const totalScheduled = db.prepare(`
    SELECT COUNT(*) as count FROM scheduling_records sr
    JOIN orders o ON sr.order_id = o.id
    WHERE ${conditionStr} AND sr.action = 'confirmed'
  `).get(...params);

  const totalCancelled = db.prepare(`
    SELECT COUNT(*) as count FROM scheduling_records sr
    JOIN orders o ON sr.order_id = o.id
    WHERE ${conditionStr} AND sr.action = 'cancelled'
  `).get(...params);

  const schedulerStats = db.prepare(`
    SELECT u.id, u.name, u.erp_id,
           COUNT(CASE WHEN sr.action = 'confirmed' THEN 1 END) as confirmed_count,
           COUNT(CASE WHEN sr.action = 'cancelled' THEN 1 END) as cancelled_count,
           COUNT(*) as total_count
    FROM scheduling_records sr
    JOIN users u ON sr.user_id = u.id
    JOIN orders o ON sr.order_id = o.id
    WHERE ${conditionStr}
    GROUP BY u.id, u.name, u.erp_id
    ORDER BY total_count DESC
  `).all(...params);

  const maliciousRejects = db.prepare(`
    SELECT * FROM malicious_rejects ORDER BY reject_count DESC LIMIT 100
  `).all();

  res.json({
    summary: {
      totalScheduled: totalScheduled.count,
      totalCancelled: totalCancelled.count
    },
    schedulerStats,
    maliciousRejects
  });
});

module.exports = router;
