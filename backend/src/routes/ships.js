const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

function checkShipDataComplete(ship) {
  const required = ['name', 'voyage', 'eta', 'draft', 'cargo_type', 'agent'];
  return required.every(field => ship[field] !== null && ship[field] !== undefined && ship[field] !== '');
}

router.get('/', (req, res) => {
  try {
    const ships = db.prepare(`
      SELECT s.*,
             sc.id as schedule_id,
             sc.berth_id,
             sc.start_time,
             sc.end_time,
             sc.status as schedule_status,
             b.name as berth_name
      FROM ships s
      LEFT JOIN schedules sc ON s.id = sc.ship_id
      LEFT JOIN berths b ON sc.berth_id = b.id
      ORDER BY s.created_at DESC
    `).all();
    // 确保data_complete字段存在
    ships.forEach(ship => {
      ship.data_complete = ship.is_complete;
    });
    res.json({ success: true, data: ships });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const ship = db.prepare('SELECT *, is_complete as data_complete FROM ships WHERE id = ?').get(req.params.id);
    if (!ship) {
      return res.status(404).json({ success: false, error: '船舶不存在' });
    }
    res.json({ success: true, data: ship });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      name, voyage, eta, draft, cargo_type, agent,
      load_volume, unload_volume, priority
    } = req.body;

    if (!name || !voyage) {
      return res.status(400).json({ success: false, error: '船名和航次必填' });
    }

    const shipData = {
      name, voyage, eta, draft, cargo_type, agent,
      load_volume, unload_volume, priority: priority || 1
    };

    shipData.is_complete = checkShipDataComplete(shipData) ? 1 : 0;

    const result = db.prepare(`
      INSERT INTO ships (name, voyage, eta, draft, cargo_type, agent, 
                        load_volume, unload_volume, priority, is_complete)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, voyage, eta, draft, cargo_type, agent,
      load_volume, unload_volume, priority || 1,
      shipData.is_complete
    );

    res.json({ success: true, data: { id: result.lastInsertRowid, ...shipData, data_complete: shipData.is_complete } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const ship = db.prepare('SELECT * FROM ships WHERE id = ?').get(req.params.id);
    if (!ship) {
      return res.status(404).json({ success: false, error: '船舶不存在' });
    }

    const updated = { ...ship, ...req.body };
    updated.is_complete = checkShipDataComplete(updated) ? 1 : 0;

    db.prepare(`
      UPDATE ships 
      SET name=?, voyage=?, eta=?, draft=?, cargo_type=?, agent=?,
          load_volume=?, unload_volume=?, priority=?, is_complete=?
      WHERE id=?
    `).run(
      updated.name, updated.voyage, updated.eta, updated.draft,
      updated.cargo_type, updated.agent, updated.load_volume, updated.unload_volume,
      updated.priority, updated.is_complete, req.params.id
    );

    res.json({ success: true, data: { ...updated, data_complete: updated.is_complete } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('BEGIN').run();
    
    db.prepare('DELETE FROM assignments WHERE schedule_id IN (SELECT id FROM schedules WHERE ship_id = ?)').run(req.params.id);
    db.prepare('DELETE FROM adjustments WHERE schedule_id IN (SELECT id FROM schedules WHERE ship_id = ?)').run(req.params.id);
    db.prepare('DELETE FROM schedules WHERE ship_id = ?').run(req.params.id);
    db.prepare('DELETE FROM ships WHERE id = ?').run(req.params.id);
    
    db.prepare('COMMIT').run();
    res.json({ success: true });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
