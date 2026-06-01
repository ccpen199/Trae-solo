const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const buildings = db.prepare(`
    SELECT b.*, 
           COUNT(DISTINCT c.id) as checkpoint_count,
           COUNT(DISTINCT p.id) as plan_count
    FROM buildings b
    LEFT JOIN checkpoints c ON b.id = c.building_id
    LEFT JOIN patrol_plans p ON b.id = p.building_id
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `).all();
  res.json(buildings);
});

router.get('/:id', (req, res) => {
  const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id);
  if (!building) {
    return res.status(404).json({ error: '楼栋不存在' });
  }
  res.json(building);
});

router.post('/', requireRole('manager'), (req, res) => {
  const { name, address, area } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '楼栋名称不能为空' });
  }

  const result = db.prepare(`
    INSERT INTO buildings (name, address, area)
    VALUES (?, ?, ?)
  `).run(name, address || '', area || '');

  const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(building);
});

router.put('/:id', requireRole('manager'), (req, res) => {
  const { name, address, area } = req.body;
  
  const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id);
  if (!building) {
    return res.status(404).json({ error: '楼栋不存在' });
  }

  db.prepare(`
    UPDATE buildings SET name = ?, address = ?, area = ?
    WHERE id = ?
  `).run(name || building.name, address || building.address, area || building.area, req.params.id);

  const updated = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', requireRole('manager'), (req, res) => {
  const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id);
  if (!building) {
    return res.status(404).json({ error: '楼栋不存在' });
  }

  db.prepare('DELETE FROM buildings WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
