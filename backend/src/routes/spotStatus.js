import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/parking-lot/:lotId', (req, res) => {
  const spots = db.prepare('SELECT * FROM spot_status WHERE parking_lot_id = ?').all(req.params.lotId);
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
      SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
      SUM(CASE WHEN status = 'fault' THEN 1 ELSE 0 END) as fault,
      SUM(CASE WHEN is_trusted = 0 THEN 1 ELSE 0 END) as untrusted,
      MAX(last_update) as last_update
    FROM spot_status WHERE parking_lot_id = ?
  `).get(req.params.lotId);
  res.json({ spots, stats });
});

router.put('/:id', (req, res) => {
  const { status, is_trusted } = req.body;
  db.prepare('UPDATE spot_status SET status = ?, is_trusted = ?, last_update = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, is_trusted ? 1 : 0, req.params.id);
  res.json({ success: true });
});

router.post('/batch-update', (req, res) => {
  const { updates } = req.body;
  const stmt = db.prepare('UPDATE spot_status SET status = ?, is_trusted = ?, last_update = CURRENT_TIMESTAMP WHERE id = ?');
  const tx = db.transaction(updates => {
    for (const u of updates) {
      stmt.run(u.status, u.is_trusted ? 1 : 0, u.id);
    }
  });
  tx(updates);
  res.json({ success: true });
});

export default router;
