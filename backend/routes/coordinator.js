const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

router.get('/tasks', (req, res) => {
  const db = getDB();
  const { coordinator_name, status, page = 1, pageSize = 10 } = req.query;
  let where = '1=1';
  const params = [];
  if (coordinator_name) { where += ' AND coordinator_name = ?'; params.push(coordinator_name); }
  if (status) { where += ' AND status = ?'; params.push(status); }
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM coordinator_tasks WHERE ${where}`).get(...params).cnt;
  const rows = db.prepare(`SELECT * FROM coordinator_tasks WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/tasks', (req, res) => {
  const db = getDB();
  const { coordinator_name, village, task_type, description, offline_flag } = req.body;
  db.prepare('INSERT INTO coordinator_tasks (coordinator_name, village, task_type, description, status, offline_flag) VALUES (?,?,?,?,?,?)').run(coordinator_name, village, task_type, description, 'pending', offline_flag ? 1 : 0);
  res.json({ data: { message: '任务已创建' } });
});

router.put('/tasks/:id/sync', (req, res) => {
  const db = getDB();
  const { status } = req.body;
  db.prepare('UPDATE coordinator_tasks SET status = ?, synced_at = datetime(\'now\',\'localtime\'), offline_flag = 0, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?').run(status || 'completed', req.params.id);
  db.prepare('INSERT INTO system_logs (module, action, operator, detail) VALUES (?,?,?,?)').run('coordinator', 'sync_task', 'system', `同步协理员任务ID=${req.params.id}`);
  res.json({ data: { id: req.params.id } });
});

router.get('/coordinators', (req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT coordinator_name, village, COUNT(*) as task_count FROM coordinator_tasks GROUP BY coordinator_name, village').all();
  res.json({ data: rows });
});

module.exports = router;
