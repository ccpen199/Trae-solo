import express from 'express';
import { db } from '../database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats/public', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = "active"').get().count;
  const completedTaskCount = db.prepare('SELECT COUNT(*) as count FROM task_accepts WHERE status = "completed"').get().count;
  const totalAmount = db.prepare('SELECT SUM(ABS(amount)) as total FROM transactions WHERE type IN ("reward", "escrow")').get().total || 0;

  res.json({
    userCount,
    taskCount,
    completedTaskCount,
    totalAmount: Math.round(totalAmount)
  });
});

router.get('/stats', authMiddleware, adminMiddleware, (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  const completedTaskCount = db.prepare('SELECT COUNT(*) as count FROM task_accepts WHERE status = "completed"').get().count;
  const totalAmount = db.prepare('SELECT SUM(amount) as total FROM transactions WHERE type = "reward"').get().total || 0;
  const pendingWithdrawals = db.prepare('SELECT COUNT(*) as count FROM withdrawals WHERE status = "pending"').get().count;
  const pendingDisputes = db.prepare('SELECT COUNT(*) as count FROM disputes WHERE status = "pending"').get().count;

  res.json({
    userCount,
    taskCount,
    completedTaskCount,
    totalAmount,
    pendingWithdrawals,
    pendingDisputes
  });
});

router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const users = db.prepare(`
    SELECT id, username, phone, real_name, verified, balance, level, risk_score, is_admin, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/tasks', authMiddleware, adminMiddleware, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT t.*, u.username as publisher_name
    FROM tasks t
    LEFT JOIN users u ON t.publisher_id = u.id
  `;
  let params = [];

  if (status) {
    sql += ' WHERE t.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const tasks = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;

  res.json({ tasks, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/disputes', authMiddleware, adminMiddleware, (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT d.*, 
      c.username as complainant_name,
      r.username as respondent_name,
      t.title as task_title
    FROM disputes d
    LEFT JOIN users c ON d.complainant_id = c.id
    LEFT JOIN users r ON d.respondent_id = r.id
    LEFT JOIN task_accepts ta ON d.task_accept_id = ta.id
    LEFT JOIN tasks t ON ta.task_id = t.id
  `;
  let params = [];

  if (status) {
    sql += ' WHERE d.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY d.created_at DESC';

  const disputes = db.prepare(sql).all(...params);
  res.json(disputes);
});

router.post('/disputes/:id/resolve', authMiddleware, adminMiddleware, (req, res) => {
  const { result, winnerId } = req.body;
  
  const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id);
  if (!dispute || dispute.status !== 'pending') {
    return res.status(400).json({ error: '无效的争议' });
  }

  const accept = db.prepare('SELECT * FROM task_accepts WHERE id = ?').get(dispute.task_accept_id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(accept.task_id);

  db.transaction(() => {
    if (winnerId == dispute.complainant_id) {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(task.reward, dispute.complainant_id);
    } else {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(task.reward, dispute.respondent_id);
    }

    db.prepare('UPDATE users SET frozen_balance = frozen_balance - ? WHERE id = ?').run(task.reward, dispute.complainant_id);

    db.prepare(`
      UPDATE disputes SET status = 'resolved', result = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(result, req.user.id, req.params.id);
  })();

  res.json({ success: true });
});

router.get('/reports', authMiddleware, adminMiddleware, (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT r.*, u.username as reporter_name
    FROM reports r
    LEFT JOIN users u ON r.reporter_id = u.id
  `;
  let params = [];

  if (status) {
    sql += ' WHERE r.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY r.created_at DESC';

  const reports = db.prepare(sql).all(...params);
  res.json(reports);
});

router.post('/reports/:id/handle', authMiddleware, adminMiddleware, (req, res) => {
  db.prepare(`
    UPDATE reports SET status = 'handled', handled_by = ?, handled_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, req.params.id);

  res.json({ success: true });
});

router.get('/transactions', authMiddleware, adminMiddleware, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const transactions = db.prepare(`
    SELECT t.*, u.username
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;

  res.json({ transactions, total, page: parseInt(page), limit: parseInt(limit) });
});

export default router;
