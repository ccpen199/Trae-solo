import { Router } from 'express';
import db from '../db/init.js';

const router = Router();

router.get('/', (req, res) => {
  const { store_id } = req.query;
  let sql = 'SELECT * FROM employees WHERE status = ?';
  const params = ['active'];
  if (store_id) {
    sql += ' AND store_id = ?';
    params.push(store_id);
  }
  const employees = db.prepare(sql).all(...params);
  res.json({ success: true, data: employees });
});

router.post('/', (req, res) => {
  const { store_id, name, phone, skills, position, max_daily_hours, max_weekly_hours } = req.body;
  const stmt = db.prepare(`
    INSERT INTO employees (store_id, name, phone, skills, position, max_daily_hours, max_weekly_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(store_id, name, phone, skills, position, max_daily_hours || 8, max_weekly_hours || 40);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { store_id, name, phone, skills, position, max_daily_hours, max_weekly_hours, status } = req.body;
  const stmt = db.prepare(`
    UPDATE employees 
    SET store_id = ?, name = ?, phone = ?, skills = ?, position = ?, max_daily_hours = ?, max_weekly_hours = ?, status = ?
    WHERE id = ?
  `);
  stmt.run(store_id, name, phone, skills, position, max_daily_hours, max_weekly_hours, status || 'active', id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE employees SET status = ? WHERE id = ?').run('inactive', id);
  res.json({ success: true });
});

export default router;
