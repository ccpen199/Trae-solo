const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const { lead_id } = req.query;
    let sql = `
      SELECT v.*, l.company_name
      FROM viewings v
      JOIN leads l ON v.lead_id = l.id
      WHERE 1=1
    `;
    const params = [];
    
    if (lead_id) {
      sql += ' AND v.lead_id = ?';
      params.push(lead_id);
    }
    
    sql += ' ORDER BY v.viewing_time DESC';
    
    const viewings = db.prepare(sql).all(...params);
    res.json(viewings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const viewing = db.prepare(`
      SELECT v.*, l.company_name, l.contact_person, l.phone
      FROM viewings v
      JOIN leads l ON v.lead_id = l.id
      WHERE v.id = ?
    `).get(req.params.id);
    
    if (!viewing) return res.status(404).json({ error: 'Viewing not found' });
    
    if (viewing.room_ids) {
      const roomIdList = viewing.room_ids.split(',').map(id => parseInt(id.trim()));
      if (roomIdList.length > 0) {
        const placeholders = roomIdList.map(() => '?').join(',');
        const rooms = db.prepare(`
          SELECT r.*, b.name as building_name, f.floor_number
          FROM rooms r
          JOIN buildings b ON r.building_id = b.id
          JOIN floors f ON r.floor_id = f.id
          WHERE r.id IN (${placeholders})
        `).all(...roomIdList);
        viewing.rooms = rooms;
      }
    }
    
    res.json(viewing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { lead_id, viewing_time, contact_person, contact_phone, room_ids, feedback, satisfaction_level, created_by } = req.body;
  try {
    if (room_ids && room_ids.length > 0) {
      for (const roomId of room_ids) {
        const room = db.prepare('SELECT status FROM rooms WHERE id = ?').get(roomId);
        if (room && room.status === 'rented') {
          return res.status(400).json({ error: `房源 ${roomId} 已出租，无法带看` });
        }
      }
    }
    
    const result = db.prepare(`
      INSERT INTO viewings (lead_id, viewing_time, contact_person, contact_phone, room_ids, feedback, satisfaction_level, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(lead_id, viewing_time, contact_person || '', contact_phone || '', room_ids ? room_ids.join(',') : '', feedback || '', satisfaction_level || null, created_by || '');
    
    const viewing = db.prepare('SELECT * FROM viewings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(viewing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { lead_id, viewing_time, contact_person, contact_phone, room_ids, feedback, satisfaction_level } = req.body;
  try {
    db.prepare(`
      UPDATE viewings 
      SET lead_id = ?, viewing_time = ?, contact_person = ?, contact_phone = ?, room_ids = ?, feedback = ?, satisfaction_level = ?
      WHERE id = ?
    `).run(lead_id, viewing_time, contact_person || '', contact_phone || '', room_ids ? (Array.isArray(room_ids) ? room_ids.join(',') : room_ids) : '', feedback || '', satisfaction_level || null, req.params.id);
    
    const viewing = db.prepare('SELECT * FROM viewings WHERE id = ?').get(req.params.id);
    res.json(viewing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM viewings WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
