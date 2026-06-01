import { Router } from 'express';
import db from '../db/init.js';

const router = Router();

router.get('/', (req, res) => {
  const { store_id, employee_id, status } = req.query;
  let sql = `
    SELECT lr.*, e.name as employee_name, s.name as store_name
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
    JOIN stores s ON e.store_id = s.id
    WHERE 1=1
  `;
  const params = [];
  if (store_id) {
    sql += ' AND e.store_id = ?';
    params.push(store_id);
  }
  if (employee_id) {
    sql += ' AND lr.employee_id = ?';
    params.push(employee_id);
  }
  if (status) {
    sql += ' AND lr.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY lr.leave_date DESC';
  const leaves = db.prepare(sql).all(...params);
  res.json({ success: true, data: leaves });
});

router.post('/', (req, res) => {
  const { employee_id, leave_date, leave_type, reason } = req.body;
  const stmt = db.prepare(`
    INSERT INTO leave_requests (employee_id, leave_date, leave_type, reason)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(employee_id, leave_date, leave_type, reason);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.prepare('UPDATE leave_requests SET status = ? WHERE id = ?').run(status, id);
  res.json({ success: true });
});

export default router;
