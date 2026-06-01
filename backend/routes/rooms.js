const express = require('express');
const router = express.Router();
const db = require('../db');

function recordHistory(roomId, fieldName, oldValue, newValue, changedBy = null) {
  if (String(oldValue) !== String(newValue)) {
    db.prepare(`
      INSERT INTO room_history (room_id, field_name, old_value, new_value, changed_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(roomId, fieldName, oldValue ? String(oldValue) : null, newValue ? String(newValue) : null, changedBy);
  }
}

router.get('/', (req, res) => {
  try {
    const { status, building_id, floor_id } = req.query;
    let sql = `
      SELECT r.*, 
             b.name as building_name,
             f.floor_number,
             CASE WHEN r.status = 'available' THEN '可租'
                  WHEN r.status = 'reserved' THEN '已预订'
                  WHEN r.status = 'rented' THEN '已出租'
                  ELSE r.status END as status_text
      FROM rooms r
      JOIN buildings b ON r.building_id = b.id
      JOIN floors f ON r.floor_id = f.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (building_id) {
      sql += ' AND r.building_id = ?';
      params.push(building_id);
    }
    if (floor_id) {
      sql += ' AND r.floor_id = ?';
      params.push(floor_id);
    }
    
    sql += ' ORDER BY b.name, f.floor_number, r.room_number';
    
    const rooms = db.prepare(sql).all(...params);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const room = db.prepare(`
      SELECT r.*, 
             b.name as building_name,
             f.floor_number
      FROM rooms r
      JOIN buildings b ON r.building_id = b.id
      JOIN floors f ON r.floor_id = f.id
      WHERE r.id = ?
    `).get(req.params.id);
    
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    const history = db.prepare(`
      SELECT * FROM room_history WHERE room_id = ? ORDER BY changed_at DESC
    `).all(req.params.id);
    
    res.json({ ...room, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { building_id, floor_id, room_number, area, business_type, rent_price, rent_unit, available_date, supporting_facilities, description } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO rooms (building_id, floor_id, room_number, area, business_type, rent_price, rent_unit, available_date, supporting_facilities, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(building_id, floor_id, room_number, area, business_type || '', rent_price, rent_unit || 'month', available_date || null, supporting_facilities || '', description || '');
    
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { building_id, floor_id, room_number, area, business_type, rent_price, rent_unit, available_date, supporting_facilities, status, description } = req.body;
  try {
    const oldRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
    if (!oldRoom) return res.status(404).json({ error: 'Room not found' });
    
    db.prepare(`
      UPDATE rooms 
      SET building_id = ?, floor_id = ?, room_number = ?, area = ?, business_type = ?, 
          rent_price = ?, rent_unit = ?, available_date = ?, supporting_facilities = ?, 
          status = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(building_id, floor_id, room_number, area, business_type || '', rent_price, rent_unit || 'month', available_date || null, supporting_facilities || '', status || 'available', description || '', req.params.id);
    
    const newRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
    
    recordHistory(req.params.id, 'room_number', oldRoom.room_number, newRoom.room_number);
    recordHistory(req.params.id, 'area', oldRoom.area, newRoom.area);
    recordHistory(req.params.id, 'rent_price', oldRoom.rent_price, newRoom.rent_price);
    recordHistory(req.params.id, 'status', oldRoom.status, newRoom.status);
    recordHistory(req.params.id, 'business_type', oldRoom.business_type, newRoom.business_type);
    
    res.json(newRoom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const contracts = db.prepare('SELECT COUNT(*) as count FROM contracts WHERE room_ids LIKE ?').get(`%${req.params.id}%`);
    if (contracts.count > 0) {
      return res.status(400).json({ error: 'Cannot delete room with existing contracts' });
    }
    
    db.prepare('DELETE FROM room_history WHERE room_id = ?').run(req.params.id);
    db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/history', (req, res) => {
  try {
    const history = db.prepare(`
      SELECT rh.*, u.name as changed_by_name
      FROM room_history rh
      LEFT JOIN users u ON rh.changed_by = u.id
      WHERE rh.room_id = ?
      ORDER BY rh.changed_at DESC
    `).all(req.params.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
