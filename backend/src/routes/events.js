import express from 'express';
import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', (req, res) => {
  const { type, category, city, page = 1, limit = 20, view } = req.query;

  if (view === 'events-only') {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM events';
    let params = [];
    let conditions = [];
    if (type) { conditions.push('type = ?'); params.push(type); }
    if (category) { conditions.push('category = ?'); params.push(category); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const events = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM events').get();
    return res.json({ data: events, total: total.count, page: Number(page), limit: Number(limit) });
  }

  const offset = (page - 1) * limit;

  let query = `
    SELECT s.id as session_id, s.start_time, s.end_time, s.status, s.is_seckill,
           s.sale_start_time, s.sale_end_time, s.total_inventory, s.sold_count,
           s.fee_rate, s.refund_policy,
           e.id as event_id, e.title as event_title, e.type as event_type, e.category,
           e.description, e.poster_url, e.duration,
           v.id as venue_id, v.name as venue_name, v.city, v.address,
           (SELECT MIN(sp2.price) FROM session_seats sp2 WHERE sp2.session_id = s.id AND sp2.status = 'available') as min_price,
           (SELECT MAX(sp3.price) FROM session_seats sp3 WHERE sp3.session_id = s.id AND sp3.status = 'available') as max_price
    FROM sessions s
    JOIN events e ON e.id = s.event_id
    JOIN venues v ON v.id = s.venue_id
  `;
  let params = [];
  let conditions = [];

  if (type) {
    conditions.push('e.type = ?');
    params.push(type);
  }

  if (category) {
    conditions.push('e.category = ?');
    params.push(category);
  }

  if (city) {
    conditions.push('v.city = ?');
    params.push(city);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY s.start_time ASC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const sessions = db.prepare(query).all(...params);

  let countQuery = `
    SELECT COUNT(*) as count FROM sessions s
    JOIN events e ON e.id = s.event_id
    JOIN venues v ON v.id = s.venue_id
  `;
  let countParams = [];
  let countConditions = [];
  if (type) { countConditions.push('e.type = ?'); countParams.push(type); }
  if (category) { countConditions.push('e.category = ?'); countParams.push(category); }
  if (city) { countConditions.push('v.city = ?'); countParams.push(city); }
  if (countConditions.length > 0) {
    countQuery += ' WHERE ' + countConditions.join(' AND ');
  }
  const total = db.prepare(countQuery).get(...countParams);

  res.json({ data: sessions, total: total.count, page: Number(page), limit: Number(limit) });
});

router.get('/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const sessions = db.prepare(`
    SELECT s.*, v.name as venue_name, v.city, v.address,
           (SELECT MIN(sp2.price) FROM session_seats sp2 WHERE sp2.session_id = s.id AND sp2.status = 'available') as min_price,
           (SELECT MAX(sp3.price) FROM session_seats sp3 WHERE sp3.session_id = s.id AND sp3.status = 'available') as max_price,
           (SELECT COUNT(*) FROM session_seats sp4 WHERE sp4.session_id = s.id AND sp4.status = 'available') as available_count
    FROM sessions s
    JOIN venues v ON v.id = s.venue_id
    WHERE s.event_id = ?
    ORDER BY s.start_time ASC
  `).all(req.params.id);

  event.sessions = sessions;
  res.json(event);
});

router.post('/', (req, res) => {
  const { title, type, category, description, poster_url, duration } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO events (id, title, type, category, description, poster_url, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, type, category || '', description || '', poster_url || '', duration || 0);

  res.status(201).json({ id, title, type, category });
});

export default router;
