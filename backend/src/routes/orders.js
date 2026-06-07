import express from 'express';
import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/', (req, res) => {
  const { user_id, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT o.*, e.title as event_title, e.poster_url, s.start_time, v.name as venue_name
    FROM orders o
    JOIN sessions s ON s.id = o.session_id
    JOIN events e ON e.id = s.event_id
    JOIN venues v ON v.id = s.venue_id
  `;
  let params = [];
  let conditions = [];
  
  if (user_id) {
    conditions.push('o.user_id = ?');
    params.push(user_id);
  }
  
  if (status) {
    conditions.push('o.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  
  const orders = db.prepare(query).all(...params);
  
  orders.forEach(order => {
    const items = db.prepare(`
      SELECT oi.*, s.row_label, s.seat_number
      FROM order_items oi
      JOIN seats s ON s.id = oi.seat_id
      WHERE oi.order_id = ?
    `).all(order.id);
    order.items = items;
  });
  
  res.json({ data: orders, total: orders.length, page: Number(page), limit: Number(limit) });
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, e.title as event_title, e.poster_url, s.start_time, v.name as venue_name, v.city
    FROM orders o
    JOIN sessions s ON s.id = o.session_id
    JOIN events e ON e.id = s.event_id
    JOIN venues v ON v.id = s.venue_id
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  const items = db.prepare(`
    SELECT oi.*, s.row_label, s.seat_number, t.id as ticket_id, t.qr_code, t.verify_code, t.status as ticket_status
    FROM order_items oi
    JOIN seats s ON s.id = oi.seat_id
    LEFT JOIN tickets t ON t.id = oi.ticket_id
    WHERE oi.order_id = ?
  `).all(order.id);
  
  order.items = items;
  res.json(order);
});

router.post('/', (req, res) => {
  const { user_id, session_id, seat_ids, channel = 'online' } = req.body;
  
  if (!user_id || !session_id || !seat_ids || seat_ids.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(session_id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  
  const seatDetails = db.prepare(`
    SELECT ss.*, s.row_label, s.seat_number, sec.name as section_name
    FROM session_seats ss
    JOIN seats s ON s.id = ss.seat_id
    JOIN seat_sections sec ON sec.id = s.section_id
    WHERE ss.session_id = ? AND ss.id IN (${seat_ids.map(() => '?').join(',')})
  `).all(session_id, ...seat_ids);
  
  const unavailable = seatDetails.filter(s => s.status !== 'locked' && s.status !== 'available');
  if (unavailable.length > 0) {
    return res.status(400).json({ error: 'Some seats are not available', unavailable });
  }
  
  const totalAmount = seatDetails.reduce((sum, s) => sum + (s.price || 0), 0);
  const orderId = uuidv4();
  
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO orders (id, user_id, session_id, total_amount, status, channel)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(orderId, user_id, session_id, totalAmount, channel);
    
    const insertItem = db.prepare(`
      INSERT INTO order_items (id, order_id, session_seat_id, seat_id, price)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    seatDetails.forEach(seat => {
      insertItem.run(uuidv4(), orderId, seat.session_seat_id || seat.id, seat.seat_id, seat.price);
    });
    
    db.prepare(`
      UPDATE session_seats
      SET status = 'sold'
      WHERE session_id = ? AND id IN (${seat_ids.map(() => '?').join(',')})
    `).run(session_id, ...seat_ids);
  });
  
  tx();
  
  res.status(201).json({ id: orderId, total_amount: totalAmount, status: 'pending' });
});

router.post('/:id/pay', (req, res) => {
  const orderId = req.params.id;
  const { payment_method } = req.body;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'pending') return res.status(400).json({ error: 'Order cannot be paid' });
  
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE orders
      SET status = 'paid', payment_method = ?, payment_time = ?
      WHERE id = ?
    `).run(payment_method || 'online', new Date().toISOString(), orderId);
    
    const insertTicket = db.prepare(`
      INSERT INTO tickets (id, order_id, user_id, session_id, seat_id, seat_info, qr_code, verify_code, watermark, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid')
    `);
    
    const updateItem = db.prepare('UPDATE order_items SET ticket_id = ? WHERE id = ?');
    
    items.forEach(item => {
      const ticketId = uuidv4();
      const verifyCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const qrData = `ticket:${ticketId}:${verifyCode}`;
      const watermark = `${order.user_id}:${Date.now()}`;
      
      insertTicket.run(ticketId, orderId, order.user_id, order.session_id, item.seat_id,
        JSON.stringify({ seat_id: item.seat_id }), qrData, verifyCode, watermark);
      
      updateItem.run(ticketId, item.id);
    });
    
    db.prepare('UPDATE sessions SET sold_count = sold_count + ? WHERE id = ?').run(items.length, order.session_id);
  });
  
  tx();
  
  res.json({ success: true, status: 'paid' });
});

router.post('/:id/refund', (req, res) => {
  const orderId = req.params.id;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'paid') return res.status(400).json({ error: 'Order cannot be refunded' });
  
  const session = db.prepare(`
    SELECT s.*, julianday(s.start_time) - julianday('now') as days_until
    FROM sessions s WHERE s.id = ?
  `).get(order.session_id);
  
  const refundPolicy = session.refund_policy ? JSON.parse(session.refund_policy) : {};
  let feeRate = refundPolicy.before24h || 0.1;
  
  if (session.days_until > 7) feeRate = refundPolicy.before7d || 0.05;
  if (session.days_until < 0) {
    return res.status(400).json({ error: 'Cannot refund after event start' });
  }
  
  const feeAmount = order.total_amount * feeRate;
  const refundAmount = order.total_amount - feeAmount;
  
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE orders
      SET status = 'refunded', refund_amount = ?, refund_time = ?
      WHERE id = ?
    `).run(refundAmount, new Date().toISOString(), orderId);
    
    db.prepare(`
      UPDATE tickets SET status = 'refunded' WHERE order_id = ?
    `).run(orderId);
    
    const seatIds = items.map(i => i.seat_id);
    db.prepare(`
      UPDATE session_seats SET status = 'available'
      WHERE session_id = ? AND seat_id IN (${seatIds.map(() => '?').join(',')})
    `).run(order.session_id, ...seatIds);
    
    db.prepare('UPDATE sessions SET sold_count = MAX(0, sold_count - ?) WHERE id = ?').run(items.length, order.session_id);
  });
  
  tx();
  
  res.json({ success: true, refund_amount: refundAmount, fee_amount: feeAmount });
});

export default router;
