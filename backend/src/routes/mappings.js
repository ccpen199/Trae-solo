const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/hotels', (req, res) => {
  const { status, channel_id } = req.query;
  let query = `
    SELECT hm.*, c.name as channel_name, h.name as hotel_name
    FROM hotel_mappings hm
    LEFT JOIN channels c ON hm.channel_id = c.id
    LEFT JOIN hotels h ON hm.hotel_id = h.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND hm.status = ?';
    params.push(status);
  }
  if (channel_id) {
    query += ' AND hm.channel_id = ?';
    params.push(channel_id);
  }
  
  const mappings = db.prepare(query).all(...params);
  res.json({ data: mappings });
});

router.post('/hotels', (req, res) => {
  const { channel_id, channel_hotel_id, channel_hotel_name, hotel_id, confidence } = req.body;
  const result = db.prepare(`
    INSERT INTO hotel_mappings (channel_id, channel_hotel_id, channel_hotel_name, hotel_id, confidence, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(channel_id, channel_hotel_id, channel_hotel_name, hotel_id || null, confidence || 0, hotel_id ? 'confirmed' : 'pending');
  res.json({ id: result.lastInsertRowid });
});

router.post('/hotels/:id/confirm', (req, res) => {
  const { hotel_id, confirmed_by } = req.body;
  db.prepare(`
    UPDATE hotel_mappings 
    SET hotel_id = ?, status = 'confirmed', confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(hotel_id, confirmed_by || 'system', req.params.id);
  res.json({ success: true });
});

router.post('/hotels/:id/reject', (req, res) => {
  db.prepare(`
    UPDATE hotel_mappings 
    SET status = 'rejected'
    WHERE id = ?
  `).run(req.params.id);
  res.json({ success: true });
});

router.get('/rooms', (req, res) => {
  const { status, hotel_mapping_id } = req.query;
  let query = `
    SELECT rm.*, hm.channel_hotel_name, rt.name as room_name, c.name as channel_name
    FROM room_mappings rm
    LEFT JOIN hotel_mappings hm ON rm.hotel_mapping_id = hm.id
    LEFT JOIN channels c ON hm.channel_id = c.id
    LEFT JOIN room_types rt ON rm.room_type_id = rt.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND rm.status = ?';
    params.push(status);
  }
  if (hotel_mapping_id) {
    query += ' AND rm.hotel_mapping_id = ?';
    params.push(hotel_mapping_id);
  }
  
  const mappings = db.prepare(query).all(...params);
  res.json({ data: mappings });
});

router.post('/rooms', (req, res) => {
  const { hotel_mapping_id, channel_room_id, channel_room_name, room_type_id, breakfast, cancellation_policy, bed_type, confidence } = req.body;
  const result = db.prepare(`
    INSERT INTO room_mappings (hotel_mapping_id, channel_room_id, channel_room_name, room_type_id, breakfast, cancellation_policy, bed_type, confidence, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(hotel_mapping_id, channel_room_id, channel_room_name, room_type_id || null, breakfast, cancellation_policy, bed_type, confidence || 0, room_type_id ? 'confirmed' : 'pending');
  res.json({ id: result.lastInsertRowid });
});

router.post('/rooms/:id/confirm', (req, res) => {
  const { room_type_id, confirmed_by } = req.body;
  db.prepare(`
    UPDATE room_mappings 
    SET room_type_id = ?, status = 'confirmed', confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(room_type_id, confirmed_by || 'system', req.params.id);
  res.json({ success: true });
});

router.post('/rooms/:id/reject', (req, res) => {
  db.prepare(`
    UPDATE room_mappings 
    SET status = 'rejected'
    WHERE id = ?
  `).run(req.params.id);
  res.json({ success: true });
});

router.get('/channels', (req, res) => {
  const channels = db.prepare('SELECT * FROM channels WHERE is_active = 1').all();
  res.json({ data: channels });
});

module.exports = router;
