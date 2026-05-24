const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const venues = db.prepare(`
    SELECT v.*, u.nickname as manager_name
    FROM venues v
    LEFT JOIN users u ON v.manager_id = u.id
    WHERE v.status = 'active'
  `).all();
  res.json(venues);
});

router.get('/:id', authenticate, (req, res) => {
  const venue = db.prepare(`
    SELECT v.*, u.nickname as manager_name
    FROM venues v
    LEFT JOIN users u ON v.manager_id = u.id
    WHERE v.id = ?
  `).get(req.params.id);
  
  if (!venue) return res.status(404).json({ error: '场馆不存在' });
  res.json(venue);
});

router.post('/', authenticate, requireRole('admin', 'venue_manager'), (req, res) => {
  const { name, address, phone, description, business_hours, lighting } = req.body;
  const info = db.prepare(`
    INSERT INTO venues (name, address, phone, manager_id, description, business_hours, lighting)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, address, phone, req.user.id, description, business_hours, lighting);
  
  res.json({ id: info.lastInsertRowid, ...req.body });
});

router.get('/:venueId/courts', authenticate, (req, res) => {
  const courts = db.prepare(`
    SELECT * FROM courts 
    WHERE venue_id = ? AND status = 'active'
  `).all(req.params.venueId);
  res.json(courts);
});

router.get('/:venueId/time-slots', authenticate, (req, res) => {
  const { date, courtId } = req.query;
  let sql = `
    SELECT ts.*, c.name as court_name, c.sport_type, c.price_per_hour
    FROM time_slots ts
    JOIN courts c ON ts.court_id = c.id
    WHERE c.venue_id = ?
  `;
  const params = [req.params.venueId];
  
  if (date) {
    sql += ' AND ts.date = ?';
    params.push(date);
  }
  if (courtId) {
    sql += ' AND ts.court_id = ?';
    params.push(courtId);
  }
  
  const slots = db.prepare(sql).all(...params);
  res.json(slots);
});

router.post('/courts', authenticate, requireRole('admin', 'venue_manager'), (req, res) => {
  const { venue_id, name, sport_type, capacity, price_per_hour, description } = req.body;
  const info = db.prepare(`
    INSERT INTO courts (venue_id, name, sport_type, capacity, price_per_hour, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(venue_id, name, sport_type, capacity, price_per_hour, description);
  
  res.json({ id: info.lastInsertRowid, ...req.body });
});

module.exports = router;
