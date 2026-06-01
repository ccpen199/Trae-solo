import { Router } from 'express';
import { db } from '../data/db.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT o.*, b.client_name, b.shoot_type, b.shoot_date
    FROM orders o
    JOIN bookings b ON b.id = o.booking_id
    ORDER BY o.created_at DESC
  `).all();
  res.json({ success: true, data: rows });
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, b.client_name, b.shoot_type, b.shoot_date, b.location, b.photographer_id,
      p.name AS photographer_name
    FROM orders o
    JOIN bookings b ON b.id = o.booking_id
    LEFT JOIN photographers p ON p.id = b.photographer_id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  res.json({ success: true, data: order });
});

router.post('/', (req, res) => {
  const { booking_id, package_name, amount, due_date } = req.body ?? {};
  if (!booking_id || !amount) {
    return res.status(400).json({ success: false, message: 'booking_id 和 amount 不能为空' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id) as {
    id: number;
    client_name: string;
    shoot_type: string;
  } | undefined;
  if (!booking) {
    return res.status(404).json({ success: false, message: '预约不存在' });
  }

  const existing = db.prepare('SELECT * FROM orders WHERE booking_id = ?').get(booking_id);
  if (existing) {
    return res.status(409).json({ success: false, message: '该预约已有订单' });
  }

  const orderNo = `PB${Date.now()}`;
  const result = db.prepare(`
    INSERT INTO orders (order_no, booking_id, package_name, amount, due_date)
    VALUES (@order_no, @booking_id, @package_name, @amount, @due_date)
  `).run({
    order_no: orderNo,
    booking_id: Number(booking_id),
    package_name: package_name || null,
    amount: Number(amount),
    due_date: due_date || null,
  });

  const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: created });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as {
    id: number;
    booking_id: number;
    status: string;
  } | undefined;
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  const { action } = req.body ?? {};

  switch (action) {
    case 'pay_deposit': {
      const { deposit } = req.body;
      const depositAmount = Number(deposit || 0);
      db.prepare(`
        UPDATE orders SET deposit_paid = 1, deposit = @deposit, paid_amount = paid_amount + @deposit, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `).run({ id, deposit: depositAmount });
      break;
    }
    case 'sign_contract': {
      db.prepare('UPDATE orders SET contract_signed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
      break;
    }
    case 'update_checklist': {
      const { checklist } = req.body;
      db.prepare('UPDATE orders SET checklist = @checklist, updated_at = CURRENT_TIMESTAMP WHERE id = @id')
        .run({ id, checklist: typeof checklist === 'object' ? JSON.stringify(checklist) : checklist });
      break;
    }
    case 'send_reminder': {
      db.prepare('UPDATE orders SET reminder_sent = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
      break;
    }
    case 'cancel': {
      const { cancel_reason } = req.body;
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(order.booking_id) as {
        photographer_id: number | null;
        shoot_date: string;
      } | undefined;
      if (booking?.photographer_id) {
        db.prepare(`
          UPDATE photographer_schedule SET status = 'available', booking_id = NULL
          WHERE photographer_id = ? AND date = ?
        `).run(booking.photographer_id, booking.shoot_date);
      }
      db.prepare(`
        UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(order.booking_id);
      db.prepare(`
        UPDATE orders SET status = 'cancelled', cancel_reason = @cancel_reason, cancel_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `).run({ id, cancel_reason: cancel_reason || null });
      break;
    }
    case 'reschedule': {
      const { new_date } = req.body;
      if (!new_date) {
        return res.status(400).json({ success: false, message: '新日期不能为空' });
      }
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(order.booking_id) as {
        photographer_id: number | null;
        shoot_date: string;
      } | undefined;
      if (booking?.photographer_id) {
        db.prepare(`
          UPDATE photographer_schedule SET status = 'available', booking_id = NULL
          WHERE photographer_id = ? AND date = ?
        `).run(booking.photographer_id, booking.shoot_date);

        db.prepare(`
          INSERT INTO photographer_schedule (photographer_id, date, status, booking_id)
          VALUES (@photographer_id, @date, 'booked', @booking_id)
          ON CONFLICT(photographer_id, date) DO UPDATE SET status = 'booked', booking_id = @booking_id
        `).run({ photographer_id: booking.photographer_id, date: new_date, booking_id: order.booking_id });
      }
      db.prepare('UPDATE bookings SET shoot_date = @new_date, updated_at = CURRENT_TIMESTAMP WHERE id = @booking_id')
        .run({ new_date, booking_id: order.booking_id });
      db.prepare(`
        UPDATE orders SET reschedule_count = reschedule_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = @id
      `).run({ id });
      break;
    }
    default: {
      const { status, package_name, amount, due_date } = req.body ?? {};
      db.prepare(`
        UPDATE orders SET
          status = COALESCE(@status, status),
          package_name = COALESCE(@package_name, package_name),
          amount = COALESCE(@amount, amount),
          due_date = COALESCE(@due_date, due_date),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `).run({
        id,
        status: status ?? null,
        package_name: package_name ?? null,
        amount: amount != null ? Number(amount) : null,
        due_date: due_date ?? null,
      });
    }
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

router.post('/:id/pay', (req, res) => {
  const { id } = req.params;
  const { amount } = req.body ?? {};
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: '支付金额必须大于0' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as {
    id: number;
    paid_amount: number;
    amount: number;
  } | undefined;
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  db.prepare('UPDATE orders SET paid_amount = paid_amount + @amount, updated_at = CURRENT_TIMESTAMP WHERE id = @id')
    .run({ id, amount: Number(amount) });

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

export default router;
