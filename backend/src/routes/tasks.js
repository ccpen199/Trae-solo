import express from 'express';
import { db } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/templates', (req, res) => {
  const templates = db.prepare('SELECT * FROM task_templates').all();
  res.json(templates);
});

router.get('/', (req, res) => {
  const { category, status = 'active', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE t.status = ?';
  let params = [status];
  
  if (category && category !== 'all') {
    whereClause += ' AND t.category = ?';
    params.push(category);
  }

  const tasks = db.prepare(`
    SELECT t.*, u.username as publisher_name,
      (SELECT COUNT(*) FROM task_accepts ta WHERE ta.task_id = t.id) as accepted_count
    FROM tasks t
    LEFT JOIN users u ON t.publisher_id = u.id
    ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM tasks t ${whereClause}`).get(...params).count;

  res.json({ tasks, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/hot', (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, u.username as publisher_name,
      (SELECT COUNT(*) FROM task_accepts ta WHERE ta.task_id = t.id) as accepted_count
    FROM tasks t
    LEFT JOIN users u ON t.publisher_id = u.id
    WHERE t.status = 'active' AND t.remaining_count > 0
    ORDER BY accepted_count DESC, t.reward DESC
    LIMIT 10
  `).all();
  res.json(tasks);
});

router.get('/my-published', authMiddleware, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM task_accepts ta WHERE ta.task_id = t.id) as accepted_count
    FROM tasks t
    WHERE t.publisher_id = ?
    ORDER BY t.created_at DESC
  `).all(req.user.id);
  res.json(tasks);
});

router.get('/my-accepted', authMiddleware, (req, res) => {
  const accepts = db.prepare(`
    SELECT ta.*, t.title, t.reward, t.category, u.username as publisher_name
    FROM task_accepts ta
    LEFT JOIN tasks t ON ta.task_id = t.id
    LEFT JOIN users u ON t.publisher_id = u.id
    WHERE ta.worker_id = ?
    ORDER BY ta.created_at DESC
  `).all(req.user.id);
  res.json(accepts);
});

router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u.username as publisher_name, u.verified as publisher_verified
    FROM tasks t
    LEFT JOIN users u ON t.publisher_id = u.id
    WHERE t.id = ?
  `).get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  res.json(task);
});

router.post('/', authMiddleware, (req, res) => {
  const { title, category, description, requirements, reward, totalCount, duration } = req.body;
  
  if (!title || !category || !description || !reward || !totalCount) {
    return res.status(400).json({ error: '请填写完整的任务信息' });
  }

  const totalAmount = parseFloat(reward) * parseInt(totalCount);
  
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  if (user.balance < totalAmount) {
    return res.status(400).json({ error: '余额不足，请先充值' });
  }

  db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ?, frozen_balance = frozen_balance + ? WHERE id = ?').run(totalAmount, totalAmount, req.user.id);
    
    const result = db.prepare(`
      INSERT INTO tasks (publisher_id, title, category, description, requirements, reward, total_count, remaining_count, duration, status, escrow_amount, audit_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 'approved')
    `).run(req.user.id, title, category, description, requirements, reward, totalCount, totalCount, duration || 3600, totalAmount);

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, related_id, related_type, description)
      VALUES (?, 'escrow', ?, ?, ?, ?, 'task', '任务托管资金')
    `).run(req.user.id, -totalAmount, user.balance, user.balance - totalAmount, result.lastInsertRowid);

    res.json({ success: true, taskId: result.lastInsertRowid });
  })();
});

router.post('/:id/accept', authMiddleware, (req, res) => {
  const taskId = req.params.id;
  
  if (!req.user.verified) {
    return res.status(400).json({ error: '请先完成实名认证' });
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task || task.status !== 'active') {
    return res.status(400).json({ error: '任务不可接取' });
  }

  if (task.publisher_id === req.user.id) {
    return res.status(400).json({ error: '不能接取自己发布的任务' });
  }

  const existing = db.prepare('SELECT id FROM task_accepts WHERE task_id = ? AND worker_id = ?').get(taskId, req.user.id);
  if (existing) {
    return res.status(400).json({ error: '已接取该任务' });
  }

  if (task.remaining_count <= 0) {
    return res.status(400).json({ error: '任务名额已满' });
  }

  db.transaction(() => {
    db.prepare('INSERT INTO task_accepts (task_id, worker_id, status) VALUES (?, ?, ?)').run(taskId, req.user.id, 'accepted');
    db.prepare('UPDATE tasks SET remaining_count = remaining_count - 1 WHERE id = ?').run(taskId);
  })();

  res.json({ success: true });
});

router.post('/:id/submit', authMiddleware, (req, res) => {
  const taskId = req.params.id;
  const { submissionData } = req.body;

  const accept = db.prepare('SELECT * FROM task_accepts WHERE task_id = ? AND worker_id = ?').get(taskId, req.user.id);
  if (!accept || accept.status !== 'accepted') {
    return res.status(400).json({ error: '无效的任务状态' });
  }

  const aiVerified = Math.random() > 0.1 ? 1 : 0;

  db.prepare(`
    UPDATE task_accepts 
    SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, submission_data = ?, ai_verified = ?
    WHERE task_id = ? AND worker_id = ?
  `).run(JSON.stringify(submissionData || {}), aiVerified, taskId, req.user.id);

  res.json({ success: true, aiVerified });
});

router.post('/:id/confirm', authMiddleware, (req, res) => {
  const taskId = req.params.id;
  const { workerId } = req.body;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (task.publisher_id !== req.user.id) {
    return res.status(403).json({ error: '无权限操作' });
  }

  const accept = db.prepare('SELECT * FROM task_accepts WHERE task_id = ? AND worker_id = ?').get(taskId, workerId);
  if (!accept || accept.status !== 'submitted') {
    return res.status(400).json({ error: '无效的状态' });
  }

  db.transaction(() => {
    db.prepare(`
      UPDATE task_accepts 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP, manual_verified = 1
      WHERE task_id = ? AND worker_id = ?
    `).run(taskId, workerId);

    const worker = db.prepare('SELECT balance FROM users WHERE id = ?').get(workerId);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(task.reward, workerId);
    
    db.prepare('UPDATE users SET frozen_balance = frozen_balance - ? WHERE id = ?').run(task.reward, req.user.id);

    const feeRate = task.reward >= 100 ? 0.01 : task.reward >= 50 ? 0.02 : 0.03;
    const fee = task.reward * feeRate;
    const actualAmount = task.reward - fee;

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, related_id, related_type, description)
      VALUES (?, 'reward', ?, ?, ?, ?, 'task', '任务奖励')
    `).run(workerId, actualAmount, worker.balance, worker.balance + actualAmount, taskId);

    db.prepare('UPDATE users SET experience = experience + 10 WHERE id = ?').run(workerId);
  })();

  res.json({ success: true });
});

router.get('/:id/accepts', authMiddleware, (req, res) => {
  const taskId = req.params.id;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const accepts = db.prepare(`
    SELECT ta.*, u.username as worker_name, u.verified as worker_verified
    FROM task_accepts ta
    LEFT JOIN users u ON ta.worker_id = u.id
    WHERE ta.task_id = ?
    ORDER BY ta.created_at DESC
  `).all(taskId);

  res.json(accepts);
});

router.post('/:id/reject', authMiddleware, (req, res) => {
  const taskId = req.params.id;
  const { workerId, reason } = req.body;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (task.publisher_id !== req.user.id) {
    return res.status(403).json({ error: '无权限操作' });
  }

  const accept = db.prepare('SELECT * FROM task_accepts WHERE task_id = ? AND worker_id = ?').get(taskId, workerId);
  if (!accept || accept.status !== 'submitted') {
    return res.status(400).json({ error: '无效的状态' });
  }

  db.transaction(() => {
    db.prepare(`
      UPDATE task_accepts 
      SET status = 'rejected', reject_reason = ?, manual_verified = 0
      WHERE task_id = ? AND worker_id = ?
    `).run(reason || '未通过审核', taskId, workerId);

    db.prepare('UPDATE users SET frozen_balance = frozen_balance - ? WHERE id = ?').run(task.reward, req.user.id);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(task.reward, req.user.id);
  })();

  res.json({ success: true });
});

router.post('/:id/report', authMiddleware, (req, res) => {
  const taskId = req.params.id;
  const { reason, description } = req.body;

  if (!reason) {
    return res.status(400).json({ error: '请填写举报原因' });
  }

  db.prepare(`
    INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
    VALUES (?, 'task', ?, ?, ?)
  `).run(req.user.id, taskId, reason, description || '');

  res.json({ success: true });
});

router.post('/:id/dispute', authMiddleware, (req, res) => {
  const taskId = req.params.id;
  const { reason, evidence } = req.body;

  const accept = db.prepare('SELECT * FROM task_accepts WHERE task_id = ? AND worker_id = ?').get(taskId, req.user.id);
  if (!accept) {
    return res.status(400).json({ error: '未接取该任务' });
  }

  const task = db.prepare('SELECT publisher_id FROM tasks WHERE id = ?').get(taskId);

  db.prepare(`
    INSERT INTO disputes (task_accept_id, complainant_id, respondent_id, reason, evidence)
    VALUES (?, ?, ?, ?, ?)
  `).run(accept.id, req.user.id, task.publisher_id, reason, JSON.stringify(evidence || {}));

  res.json({ success: true });
});

export default router;
