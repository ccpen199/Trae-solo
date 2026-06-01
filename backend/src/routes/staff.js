import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { role, store_id } = req.query;
  let sql = 'SELECT * FROM staff WHERE 1=1';
  const params = [];
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (store_id) { sql += ' AND store_id = ?'; params.push(store_id); }
  sql += ' ORDER BY id';
  const staff = db.prepare(sql).all(...params);
  res.json(staff);
});

router.get('/:id', (req, res) => {
  const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!staff) return res.status(404).json({ error: '人员不存在' });
  res.json(staff);
});

router.get('/:id/schedule', (req, res) => {
  const { date } = req.query;
  let sql = 'SELECT * FROM schedules WHERE staff_id = ?';
  const params = [req.params.id];
  if (date) { sql += ' AND date = ?'; params.push(date); }
  sql += ' ORDER BY start_time';
  const schedules = db.prepare(sql).all(...params);
  res.json(schedules);
});

router.post('/', (req, res) => {
  const { name, role, store_id, phone } = req.body;
  const result = db.prepare(
    'INSERT INTO staff (name, role, store_id, phone) VALUES (?, ?, ?, ?)'
  ).run(name, role, store_id, phone);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.put('/:id', (req, res) => {
  const { name, role, store_id, phone } = req.body;
  db.prepare(
    'UPDATE staff SET name = ?, role = ?, store_id = ?, phone = ? WHERE id = ?'
  ).run(name, role, store_id, phone, req.params.id);
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
