import { Router } from 'express';
import db from '../db/init.js';
import dayjs from 'dayjs';

const router = Router();

router.get('/', (req, res) => {
  const { store_id, start_date, end_date, loss_type, is_abnormal } = req.query;
  let sql = `
    SELECT ml.*, m.name as material_name, m.category, m.unit
    FROM material_loss ml
    JOIN materials m ON ml.material_id = m.id
    WHERE 1=1
  `;
  const params = [];
  if (store_id) {
    sql += ' AND ml.store_id = ?';
    params.push(store_id);
  }
  if (start_date && end_date) {
    sql += ' AND ml.loss_date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  if (loss_type) {
    sql += ' AND ml.loss_type = ?';
    params.push(loss_type);
  }
  if (is_abnormal !== undefined) {
    sql += ' AND ml.is_abnormal = ?';
    params.push(is_abnormal);
  }
  sql += ' ORDER BY ml.loss_date DESC';
  const losses = db.prepare(sql).all(...params);
  res.json({ success: true, data: losses });
});

router.get('/summary', (req, res) => {
  const { store_id, start_date, end_date } = req.query;
  let sql = `
    SELECT ml.loss_type, COUNT(*) as count, SUM(ml.quantity) as total_quantity,
      m.category,
      SUM(CASE WHEN ml.is_abnormal = 1 THEN 1 ELSE 0 END) as abnormal_count
    FROM material_loss ml
    JOIN materials m ON ml.material_id = m.id
    WHERE 1=1
  `;
  const params = [];
  if (store_id) {
    sql += ' AND ml.store_id = ?';
    params.push(store_id);
  }
  if (start_date && end_date) {
    sql += ' AND ml.loss_date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  sql += ' GROUP BY ml.loss_type, m.category ORDER BY total_quantity DESC';
  const summary = db.prepare(sql).all(...params);
  res.json({ success: true, data: summary });
});

router.post('/', (req, res) => {
  const { material_id, store_id, batch_id, loss_date, quantity, loss_type, reason, is_abnormal } = req.body;
  const stmt = db.prepare(`
    INSERT INTO material_loss (material_id, store_id, batch_id, loss_date, quantity, loss_type, reason, is_abnormal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(material_id, store_id, batch_id || null, loss_date, quantity, loss_type, reason, is_abnormal || 0);
  
  if (batch_id) {
    db.prepare('UPDATE material_batches SET quantity = quantity - ? WHERE id = ?').run(quantity, batch_id);
  }
  
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.put('/:id/followup', (req, res) => {
  const { id } = req.params;
  const { follow_up_status } = req.body;
  db.prepare('UPDATE material_loss SET follow_up_status = ? WHERE id = ?').run(follow_up_status, id);
  res.json({ success: true });
});

router.get('/abnormal', (req, res) => {
  const { store_id } = req.query;
  let sql = `
    SELECT ml.*, m.name as material_name, m.category, m.unit, s.name as store_name
    FROM material_loss ml
    JOIN materials m ON ml.material_id = m.id
    JOIN stores s ON ml.store_id = s.id
    WHERE ml.is_abnormal = 1 AND ml.follow_up_status = 'pending'
  `;
  const params = [];
  if (store_id) {
    sql += ' AND ml.store_id = ?';
    params.push(store_id);
  }
  sql += ' ORDER BY ml.loss_date DESC';
  const abnormal = db.prepare(sql).all(...params);
  res.json({ success: true, data: abnormal });
});

export default router;
