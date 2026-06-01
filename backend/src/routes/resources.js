const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

router.get('/', (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM resources';
    let params = [];
    
    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }
    query += ' ORDER BY type, name';
    
    const resources = db.prepare(query).all(...params);
    res.json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/assignments', (req, res) => {
  try {
    const assignments = db.prepare(`
      SELECT a.*, r.name as resource_name, r.type as resource_type,
             s.name as ship_name, s.voyage, b.name as berth_name
      FROM assignments a
      JOIN resources r ON a.resource_id = r.id
      JOIN schedules sc ON a.schedule_id = sc.id
      JOIN ships s ON sc.ship_id = s.id
      LEFT JOIN berths b ON sc.berth_id = b.id
      ORDER BY a.start_time DESC
    `).all();
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/assign', (req, res) => {
  try {
    const { schedule_id, resource_id, start_time, end_time } = req.body;
    
    const existing = db.prepare(`
      SELECT * FROM assignments 
      WHERE resource_id = ? 
      AND status = 'assigned'
      AND (
        (start_time < ? AND end_time > ?)
        OR (start_time < ? AND end_time > ?)
        OR (start_time >= ? AND end_time <= ?)
      )
    `).all(resource_id, end_time, start_time, end_time, start_time, start_time, end_time);
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: '该资源在指定时间已被占用' 
      });
    }
    
    const result = db.prepare(`
      INSERT INTO assignments (schedule_id, resource_id, start_time, end_time)
      VALUES (?, ?, ?, ?)
    `).run(schedule_id, resource_id, start_time, end_time);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/assignments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
