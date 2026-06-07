import express from 'express';
import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/', (req, res) => {
  const { event_id, venue_id, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT s.*, e.title as event_title, e.type as event_type, e.poster_url,
           v.name as venue_name, v.city
    FROM sessions s
    JOIN events e ON e.id = s.event_id
    JOIN venues v ON v.id = s.venue_id
  `;
  let params = [];
  let conditions = [];
  
  if (event_id) {
    conditions.push('s.event_id = ?');
    params.push(event_id);
  }
  
  if (venue_id) {
    conditions.push('s.venue_id = ?');
    params.push(venue_id);
  }
  
  if (status) {
    conditions.push('s.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY s.start_time ASC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  
  const sessions = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
  
  res.json({ data: sessions, total: total.count, page: Number(page), limit: Number(limit) });
});

router.get('/:id', (req, res) => {
  const session = db.prepare(`
    SELECT s.*, e.title as event_title, e.type as event_type, e.description, e.poster_url,
           v.name as venue_name, v.city, v.address
    FROM sessions s
    JOIN events e ON e.id = s.event_id
    JOIN venues v ON v.id = s.venue_id
    WHERE s.id = ?
  `).get(req.params.id);
  
  if (!session) return res.status(404).json({ error: 'Session not found' });
  
  session.refund_policy = session.refund_policy ? JSON.parse(session.refund_policy) : null;
  
  res.json(session);
});

router.get('/:id/seats', (req, res) => {
  const sessionId = req.params.id;
  
  const sections = db.prepare(`
    SELECT ss.*, sec.name as section_name, sec.price_level, sec.is_blind_zone, sec.coordinates
    FROM session_seats ss
    JOIN seats s ON s.id = ss.seat_id
    JOIN seat_sections sec ON sec.id = s.section_id
    WHERE ss.session_id = ?
    GROUP BY sec.id
  `).all(sessionId);
  
  const seatsBySection = {};
  
  sections.forEach(section => {
    const seats = db.prepare(`
      SELECT ss.id as session_seat_id, ss.status, ss.price, ss.lock_expire_at,
             s.row_label, s.seat_number, s.x, s.y, s.z
      FROM session_seats ss
      JOIN seats s ON s.id = ss.seat_id
      JOIN seat_sections sec ON sec.id = s.section_id
      WHERE ss.session_id = ? AND sec.id = ?
    `).all(sessionId, section.id);
    
    seatsBySection[section.id] = {
      ...section,
      coordinates: section.coordinates ? JSON.parse(section.coordinates) : null,
      seats
    };
  });
  
  res.json(Object.values(seatsBySection));
});

router.post('/:id/lock-seats', (req, res) => {
  const { seat_ids, user_id } = req.body;
  const sessionId = req.params.id;
  
  if (!seat_ids || seat_ids.length === 0) {
    return res.status(400).json({ error: 'No seats specified' });
  }
  
  const lockExpire = dayjs().add(10, 'minute').toISOString();
  const lockId = uuidv4();
  
  const checkAvailable = db.prepare(`
    SELECT id, status FROM session_seats
    WHERE session_id = ? AND id IN (${seat_ids.map(() => '?').join(',')})
  `);
  
  const seats = checkAvailable.all(sessionId, ...seat_ids);
  const unavailable = seats.filter(s => s.status !== 'available');
  
  if (unavailable.length > 0) {
    return res.status(400).json({ error: 'Some seats are not available', unavailable });
  }
  
  const lockSeats = db.prepare(`
    UPDATE session_seats
    SET status = 'locked', lock_expire_at = ?, locked_by = ?
    WHERE session_id = ? AND id IN (${seat_ids.map(() => '?').join(',')})
  `);
  
  lockSeats.run(lockExpire, user_id || 'anonymous', sessionId, ...seat_ids);
  
  res.json({ success: true, lock_id: lockId, expire_at: lockExpire, locked_seats: seat_ids });
});

router.post('/:id/unlock-seats', (req, res) => {
  const { seat_ids } = req.body;
  const sessionId = req.params.id;
  
  db.prepare(`
    UPDATE session_seats
    SET status = 'available', lock_expire_at = NULL, locked_by = NULL
    WHERE session_id = ? AND id IN (${seat_ids.map(() => '?').join(',')}) AND status = 'locked'
  `).run(sessionId, ...seat_ids);
  
  res.json({ success: true });
});

router.post('/', (req, res) => {
  const { event_id, venue_id, start_time, end_time, sale_start_time, sale_end_time, is_seckill, refund_policy, fee_rate } = req.body;
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO sessions (id, event_id, venue_id, start_time, end_time, status, sale_start_time, sale_end_time, is_seckill, refund_policy, fee_rate, total_inventory, sold_count)
    VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, 0, 0)
  `).run(id, event_id, venue_id, start_time, end_time, sale_start_time, sale_end_time,
        is_seckill ? 1 : 0, JSON.stringify(refund_policy || {}), fee_rate || 0);
  
  res.status(201).json({ id, event_id, venue_id, start_time });
});

router.post('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['draft', 'presale', 'onsale', 'seckill', 'soldout', 'ended', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, req.params.id);
  
  res.json({ success: true, status });
});

export default router;
