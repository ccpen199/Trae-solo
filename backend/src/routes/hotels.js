const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { city, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = 'SELECT * FROM hotels WHERE 1=1';
  const params = [];
  
  if (city) {
    query += ' AND city LIKE ?';
    params.push(`%${city}%`);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const hotels = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM hotels WHERE 1=1' + (city ? ' AND city LIKE ?' : '')).get(...(city ? [`%${city}%`] : [])).count;
  
  res.json({ data: hotels, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/', (req, res) => {
  const { name, address, city, star_rating } = req.body;
  const result = db.prepare('INSERT INTO hotels (name, address, city, star_rating) VALUES (?, ?, ?, ?)').run(name, address, city, star_rating);
  res.json({ id: result.lastInsertRowid, name, address, city, star_rating });
});

router.get('/:id', (req, res) => {
  const hotel = db.prepare('SELECT * FROM hotels WHERE id = ?').get(req.params.id);
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  
  const rooms = db.prepare('SELECT * FROM room_types WHERE hotel_id = ?').all(req.params.id);
  res.json({ ...hotel, rooms });
});

router.put('/:id', (req, res) => {
  const { name, address, city, star_rating } = req.body;
  db.prepare('UPDATE hotels SET name=?, address=?, city=?, star_rating=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(name, address, city, star_rating, req.params.id);
  res.json({ id: req.params.id, name, address, city, star_rating });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM hotels WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
