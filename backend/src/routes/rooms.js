const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { hotel_id } = req.query;
  let query = 'SELECT rt.*, h.name as hotel_name FROM room_types rt LEFT JOIN hotels h ON rt.hotel_id = h.id WHERE 1=1';
  const params = [];
  
  if (hotel_id) {
    query += ' AND rt.hotel_id = ?';
    params.push(hotel_id);
  }
  
  const rooms = db.prepare(query).all(...params);
  res.json({ data: rooms });
});

router.post('/', (req, res) => {
  const { hotel_id, name, bed_type, max_guests, area } = req.body;
  const result = db.prepare('INSERT INTO room_types (hotel_id, name, bed_type, max_guests, area) VALUES (?, ?, ?, ?, ?)').run(hotel_id, name, bed_type, max_guests, area);
  res.json({ id: result.lastInsertRowid, hotel_id, name, bed_type, max_guests, area });
});

router.put('/:id', (req, res) => {
  const { name, bed_type, max_guests, area } = req.body;
  db.prepare('UPDATE room_types SET name=?, bed_type=?, max_guests=?, area=? WHERE id=?').run(name, bed_type, max_guests, area, req.params.id);
  res.json({ id: req.params.id, name, bed_type, max_guests, area });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM room_types WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
