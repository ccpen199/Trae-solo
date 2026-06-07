import express from 'express';
import { db } from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { user_id, session_id, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT t.*, e.title as event_title, e.poster_url, s.start_time, v.name as venue_name
    FROM tickets t
    JOIN sessions s ON s.id = t.session_id
    JOIN events e ON e.id = s.event_id
    JOIN venues v ON v.id = s.venue_id
  `;
  let params = [];
  let conditions = [];
  
  if (user_id) {
    conditions.push('t.user_id = ?');
    params.push(user_id);
  }
  
  if (session_id) {
    conditions.push('t.session_id = ?');
    params.push(session_id);
  }
  
  if (status) {
    conditions.push('t.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  
  const tickets = db.prepare(query).all(...params);
  
  tickets.forEach(t => {
    t.seat_info = t.seat_info ? JSON.parse(t.seat_info) : null;
  });
  
  res.json({ data: tickets, total: tickets.length, page: Number(page), limit: Number(limit) });
});

router.get('/:id', (req, res) => {
  const ticket = db.prepare(`
    SELECT t.*, e.title as event_title, e.poster_url, e.duration,
           s.start_time, s.end_time, v.name as venue_name, v.city, v.address,
           o.total_amount, o.payment_time
    FROM tickets t
    JOIN sessions s ON s.id = t.session_id
    JOIN events e ON e.id = s.event_id
    JOIN venues v ON v.id = s.venue_id
    JOIN orders o ON o.id = t.order_id
    WHERE t.id = ?
  `).get(req.params.id);
  
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  
  ticket.seat_info = ticket.seat_info ? JSON.parse(ticket.seat_info) : null;
  
  const verifyRecords = db.prepare(`
    SELECT * FROM verify_records WHERE ticket_id = ? ORDER BY verify_time DESC
  `).all(req.params.id);
  
  ticket.verify_records = verifyRecords;
  res.json(ticket);
});

router.post('/:id/verify', (req, res) => {
  const { verify_code, method = 'qrcode', operator } = req.body;
  const ticketId = req.params.id;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  
  if (ticket.status !== 'valid') {
    return res.status(400).json({ error: 'Ticket is not valid', status: ticket.status });
  }
  
  if (ticket.verify_code !== verify_code) {
    db.prepare(`
      INSERT INTO verify_records (id, ticket_id, verify_method, operator, result)
      VALUES (?, ?, ?, ?, 'failed')
    `).run(Math.random().toString(36).substring(2, 15), ticketId, method, operator || 'system');
    
    return res.status(400).json({ error: 'Invalid verification code' });
  }
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE tickets
      SET status = 'verified', verify_count = verify_count + 1, last_verify_time = ?
      WHERE id = ?
    `).run(new Date().toISOString(), ticketId);
    
    db.prepare(`
      INSERT INTO verify_records (id, ticket_id, verify_method, operator, result)
      VALUES (?, ?, ?, ?, 'success')
    `).run(Math.random().toString(36).substring(2, 15), ticketId, method, operator || 'system');
  });
  
  tx();
  
  res.json({ success: true, status: 'verified' });
});

export default router;
