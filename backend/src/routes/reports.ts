import { Router } from 'express';
import { db } from '../data/db.js';

const router = Router();

router.get('/summary', (_req, res) => {
  const revenue = (db.prepare('SELECT COALESCE(SUM(amount), 0) AS value FROM orders').get() as { value: number }).value;
  const paid = (db.prepare('SELECT COALESCE(SUM(paid_amount), 0) AS value FROM orders').get() as { value: number }).value;
  const bookingCount = (db.prepare('SELECT COUNT(*) AS value FROM bookings').get() as { value: number }).value;
  const openDeliveries = (db.prepare("SELECT COUNT(*) AS value FROM deliveries WHERE status NOT IN ('已完成', 'completed')").get() as { value: number }).value;
  const nextBookings = db.prepare(`
    SELECT b.client_name, b.shoot_type, b.shoot_date, b.location, b.status, p.name AS photographer_name
    FROM bookings b
    LEFT JOIN photographers p ON p.id = b.photographer_id
    WHERE b.shoot_date >= date('now') AND b.status NOT IN ('cancelled', 'completed')
    ORDER BY b.shoot_date ASC
    LIMIT 5
  `).all();

  res.json({
    success: true,
    data: {
      revenue,
      paid,
      outstanding: revenue - paid,
      bookingCount,
      openDeliveries,
      nextBookings,
    },
  });
});

router.get('/conversion', (_req, res) => {
  const total = (db.prepare('SELECT COUNT(*) AS value FROM bookings').get() as { value: number }).value;
  const confirmed = (db.prepare("SELECT COUNT(*) AS value FROM bookings WHERE status = 'confirmed'").get() as { value: number }).value;
  const cancelled = (db.prepare("SELECT COUNT(*) AS value FROM bookings WHERE status = 'cancelled'").get() as { value: number }).value;
  const completed = (db.prepare("SELECT COUNT(*) AS value FROM bookings WHERE status = 'completed'").get() as { value: number }).value;
  const conversionRate = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;

  res.json({
    success: true,
    data: {
      total_bookings: total,
      confirmed,
      cancelled,
      completed,
      conversion_rate: conversionRate,
    },
  });
});

router.get('/schedule-utilization', (_req, res) => {
  const rows = db.prepare(`
    SELECT
      p.id AS photographer_id,
      p.name AS photographer_name,
      COUNT(ps.id) AS total_available_days,
      SUM(CASE WHEN ps.status = 'booked' THEN 1 ELSE 0 END) AS booked_days,
      CASE WHEN COUNT(ps.id) > 0
        THEN ROUND(SUM(CASE WHEN ps.status = 'booked' THEN 1 ELSE 0 END) * 100.0 / COUNT(ps.id), 2)
        ELSE 0
      END AS utilization_rate
    FROM photographers p
    LEFT JOIN photographer_schedule ps ON ps.photographer_id = p.id
    GROUP BY p.id, p.name
    ORDER BY p.id
  `).all();

  res.json({ success: true, data: rows });
});

router.get('/refunds', (_req, res) => {
  const rows = db.prepare(`
    SELECT r.*, o.order_no, o.amount AS order_amount, b.client_name
    FROM refund_records r
    JOIN orders o ON o.id = r.order_id
    JOIN bookings b ON b.id = o.booking_id
    ORDER BY r.created_at DESC
  `).all();
  res.json({ success: true, data: rows });
});

router.get('/complaints', (_req, res) => {
  const rows = db.prepare(`
    SELECT c.*, o.order_no, o.amount AS order_amount, b.client_name AS booking_client_name
    FROM complaints c
    JOIN orders o ON o.id = c.order_id
    JOIN bookings b ON b.id = o.booking_id
    ORDER BY c.created_at DESC
  `).all();
  res.json({ success: true, data: rows });
});

router.get('/photographer-income', (_req, res) => {
  const rows = db.prepare(`
    SELECT
      p.id AS photographer_id,
      p.name AS photographer_name,
      COALESCE(SUM(o.amount), 0) AS total_income,
      COUNT(o.id) AS order_count,
      CASE WHEN COUNT(o.id) > 0
        THEN ROUND(SUM(o.amount) / COUNT(o.id), 2)
        ELSE 0
      END AS avg_order_value
    FROM photographers p
    LEFT JOIN bookings b ON b.photographer_id = p.id AND b.status NOT IN ('cancelled')
    LEFT JOIN orders o ON o.booking_id = b.id AND o.status NOT IN ('cancelled')
    GROUP BY p.id, p.name
    ORDER BY total_income DESC
  `).all();
  res.json({ success: true, data: rows });
});

router.post('/refunds', (req, res) => {
  const { order_id, amount, reason } = req.body ?? {};
  if (!order_id || !amount) {
    return res.status(400).json({ success: false, message: 'order_id 和 amount 不能为空' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id) as {
    id: number;
    order_no: string;
    paid_amount: number;
  } | undefined;
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  if (Number(amount) > order.paid_amount) {
    return res.status(400).json({ success: false, message: '退款金额不能大于已支付金额' });
  }

  const result = db.prepare(`
    INSERT INTO refund_records (order_id, amount, reason, status)
    VALUES (@order_id, @amount, @reason, 'pending')
  `).run({
    order_id: Number(order_id),
    amount: Number(amount),
    reason: reason || null,
  });

  const created = db.prepare(`
    SELECT r.*, o.order_no, o.amount AS order_amount, b.client_name
    FROM refund_records r
    JOIN orders o ON o.id = r.order_id
    JOIN bookings b ON b.id = o.booking_id
    WHERE r.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ success: true, data: created });
});

router.put('/refunds/:id', (req, res) => {
  const { id } = req.params;
  const { status, resolution } = req.body ?? {};

  const refund = db.prepare('SELECT * FROM refund_records WHERE id = ?').get(id) as {
    id: number;
    order_id: number;
    amount: number;
    status: string;
  } | undefined;
  if (!refund) {
    return res.status(404).json({ success: false, message: '退款记录不存在' });
  }

  if (status === 'approved') {
    db.prepare('UPDATE orders SET paid_amount = paid_amount - @amount, updated_at = CURRENT_TIMESTAMP WHERE id = @order_id')
      .run({ amount: Number(refund.amount), order_id: refund.order_id });
  }

  db.prepare(`
    UPDATE refund_records SET status = @status, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({
    id,
    status: status || refund.status,
  });

  const updated = db.prepare(`
    SELECT r.*, o.order_no, o.amount AS order_amount, b.client_name
    FROM refund_records r
    JOIN orders o ON o.id = r.order_id
    JOIN bookings b ON b.id = o.booking_id
    WHERE r.id = ?
  `).get(id);

  res.json({ success: true, data: updated });
});

router.post('/complaints', (req, res) => {
  const { order_id, client_name, content } = req.body ?? {};
  if (!order_id || !content) {
    return res.status(400).json({ success: false, message: 'order_id 和 content 不能为空' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  const result = db.prepare(`
    INSERT INTO complaints (order_id, client_name, content, status)
    VALUES (@order_id, @client_name, @content, 'open')
  `).run({
    order_id: Number(order_id),
    client_name: client_name || null,
    content,
  });

  const created = db.prepare(`
    SELECT c.*, o.order_no, o.amount AS order_amount, b.client_name AS booking_client_name
    FROM complaints c
    JOIN orders o ON o.id = c.order_id
    JOIN bookings b ON b.id = o.booking_id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ success: true, data: created });
});

router.put('/complaints/:id', (req, res) => {
  const { id } = req.params;
  const { status, resolution } = req.body ?? {};

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as {
    id: number;
    status: string;
    resolution: string | null;
  } | undefined;
  if (!complaint) {
    return res.status(404).json({ success: false, message: '客诉记录不存在' });
  }

  db.prepare(`
    UPDATE complaints SET status = @status, resolution = @resolution, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({
    id,
    status: status || complaint.status,
    resolution: resolution || complaint.resolution,
  });

  const updated = db.prepare(`
    SELECT c.*, o.order_no, o.amount AS order_amount, b.client_name AS booking_client_name
    FROM complaints c
    JOIN orders o ON o.id = c.order_id
    JOIN bookings b ON b.id = o.booking_id
    WHERE c.id = ?
  `).get(id);

  res.json({ success: true, data: updated });
});

export default router;
