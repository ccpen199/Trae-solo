const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const buildings = db.prepare(`
      SELECT b.*, 
             COUNT(DISTINCT f.id) as floor_count,
             COUNT(DISTINCT r.id) as room_count
      FROM buildings b
      LEFT JOIN floors f ON b.id = f.building_id
      LEFT JOIN rooms r ON b.id = r.building_id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `).all();
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    
    const floors = db.prepare(`
      SELECT f.*, COUNT(r.id) as room_count
      FROM floors f
      LEFT JOIN rooms r ON f.id = r.floor_id
      WHERE f.building_id = ?
      GROUP BY f.id
      ORDER BY f.floor_number
    `).all(req.params.id);
    
    res.json({ ...building, floors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { name, total_floors, total_area, address, description } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO buildings (name, total_floors, total_area, address, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, total_floors || 0, total_area || 0, address || '', description || '');
    
    const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(building);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, total_floors, total_area, address, description } = req.body;
  try {
    db.prepare(`
      UPDATE buildings 
      SET name = ?, total_floors = ?, total_area = ?, address = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, total_floors || 0, total_area || 0, address || '', description || '', req.params.id);
    
    const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id);
    res.json(building);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const rooms = db.prepare('SELECT COUNT(*) as count FROM rooms WHERE building_id = ?').get(req.params.id);
    if (rooms.count > 0) {
      return res.status(400).json({ error: 'Cannot delete building with existing rooms' });
    }
    
    db.prepare('DELETE FROM floors WHERE building_id = ?').run(req.params.id);
    db.prepare('DELETE FROM buildings WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/floors', (req, res) => {
  const { floor_number, area, unit_count, description } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO floors (building_id, floor_number, area, unit_count, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, floor_number, area || 0, unit_count || 0, description || '');
    
    const floor = db.prepare('SELECT * FROM floors WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(floor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/floors', (req, res) => {
  try {
    const floors = db.prepare(`
      SELECT f.*, COUNT(r.id) as room_count
      FROM floors f
      LEFT JOIN rooms r ON f.id = r.floor_id
      WHERE f.building_id = ?
      GROUP BY f.id
      ORDER BY f.floor_number
    `).all(req.params.id);
    res.json(floors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
