import { Router } from 'express';
import db from '../db/init.js';
import dayjs from 'dayjs';

const router = Router();

router.get('/', (req, res) => {
  const materials = db.prepare('SELECT * FROM materials ORDER BY category, name').all();
  res.json({ success: true, data: materials });
});

router.post('/', (req, res) => {
  const { name, category, unit, warning_days } = req.body;
  const stmt = db.prepare(`
    INSERT INTO materials (name, category, unit, warning_days)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(name, category, unit, warning_days || 7);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.get('/batches', (req, res) => {
  const { store_id, material_id, status } = req.query;
  let sql = `
    SELECT mb.*, m.name as material_name, m.category, m.unit, m.warning_days,
      julianday(mb.expiry_date) - julianday('now') as days_to_expiry
    FROM material_batches mb
    JOIN materials m ON mb.material_id = m.id
    WHERE 1=1
  `;
  const params = [];
  if (store_id) {
    sql += ' AND mb.store_id = ?';
    params.push(store_id);
  }
  if (material_id) {
    sql += ' AND mb.material_id = ?';
    params.push(material_id);
  }
  if (status) {
    sql += ' AND mb.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY mb.expiry_date ASC';
  const batches = db.prepare(sql).all(...params);
  res.json({ success: true, data: batches });
});

router.get('/batches/warning', (req, res) => {
  const { store_id } = req.query;
  const today = dayjs().format('YYYY-MM-DD');
  let sql = `
    SELECT mb.*, m.name as material_name, m.category, m.unit, m.warning_days,
      julianday(mb.expiry_date) - julianday('now') as days_to_expiry
    FROM material_batches mb
    JOIN materials m ON mb.material_id = m.id
    WHERE mb.quantity > 0 
      AND julianday(mb.expiry_date) - julianday('now') <= m.warning_days
      AND julianday(mb.expiry_date) - julianday('now') >= 0
  `;
  const params = [];
  if (store_id) {
    sql += ' AND mb.store_id = ?';
    params.push(store_id);
  }
  sql += ' ORDER BY days_to_expiry ASC';
  const warnings = db.prepare(sql).all(...params);
  res.json({ success: true, data: warnings });
});

router.get('/batches/expired', (req, res) => {
  const { store_id } = req.query;
  let sql = `
    SELECT mb.*, m.name as material_name, m.category, m.unit,
      julianday('now') - julianday(mb.expiry_date) as days_expired
    FROM material_batches mb
    JOIN materials m ON mb.material_id = m.id
    WHERE mb.quantity > 0 AND julianday(mb.expiry_date) < julianday('now')
  `;
  const params = [];
  if (store_id) {
    sql += ' AND mb.store_id = ?';
    params.push(store_id);
  }
  sql += ' ORDER BY days_expired DESC';
  const expired = db.prepare(sql).all(...params);
  res.json({ success: true, data: expired });
});

router.post('/batches', (req, res) => {
  const { material_id, store_id, batch_no, quantity, unit_price, production_date, expiry_date, received_date } = req.body;
  const stmt = db.prepare(`
    INSERT INTO material_batches (material_id, store_id, batch_no, quantity, unit_price, production_date, expiry_date, received_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(material_id, store_id, batch_no, quantity, unit_price, production_date, expiry_date, received_date || dayjs().format('YYYY-MM-DD'));
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.get('/inventory', (req, res) => {
  const { store_id } = req.query;
  let sql = `
    SELECT m.id as material_id, m.name, m.category, m.unit,
      SUM(mb.quantity) as total_quantity,
      MIN(mb.expiry_date) as earliest_expiry
    FROM materials m
    LEFT JOIN material_batches mb ON m.id = mb.material_id
    WHERE 1=1
  `;
  const params = [];
  if (store_id) {
    sql += ' AND mb.store_id = ?';
    params.push(store_id);
  }
  sql += ' GROUP BY m.id, m.name, m.category, m.unit ORDER BY m.category, m.name';
  const inventory = db.prepare(sql).all(...params);
  res.json({ success: true, data: inventory });
});

export default router;
