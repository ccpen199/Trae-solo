import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/suppliers', (req, res) => {
  const list = db.prepare('SELECT * FROM suppliers ORDER BY id').all();
  res.json({ success: true, data: list });
});

router.get('/locations', (req, res) => {
  const list = db.prepare('SELECT * FROM locations WHERE status = 1 ORDER BY id').all();
  res.json({ success: true, data: list });
});

router.get('/users', (req, res) => {
  const { role } = req.query;
  let sql = 'SELECT * FROM users WHERE status = 1';
  const params = [];
  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }
  sql += ' ORDER BY id';
  const list = db.prepare(sql).all(...params);
  res.json({ success: true, data: list });
});

router.get('/parts-simple', (req, res) => {
  const list = db.prepare(`
    SELECT id, sku, name, model, category, unit
    FROM spare_parts
    WHERE status = 1
    ORDER BY id
  `).all();
  res.json({ success: true, data: list });
});

router.get('/stock-batches', (req, res) => {
  const { part_id, location_id } = req.query;

  let whereClause = 'WHERE st.available_qty > 0';
  const params = [];

  if (part_id) {
    whereClause += ' AND st.part_id = ?';
    params.push(part_id);
  }
  if (location_id) {
    whereClause += ' AND st.location_id = ?';
    params.push(location_id);
  }

  const list = db.prepare(`
    SELECT st.*, sp.name as part_name, sp.sku, l.name as location_name
    FROM stock st
    JOIN spare_parts sp ON st.part_id = sp.id
    JOIN locations l ON st.location_id = l.id
    ${whereClause}
    ORDER BY st.id
  `).all(...params);

  res.json({ success: true, data: list });
});

export default router;
