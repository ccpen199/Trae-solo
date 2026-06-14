const express = require('express');
const db = require('../db');
const { authenticate, authenticateOptional, requireRole } = require('../middleware/auth');

const router = express.Router();

const calculateMatchScore = (task, worker) => {
  let score = 0;
  const taskSkills = task.skills_required ? JSON.parse(task.skills_required) : [];
  const workerSkills = worker.skills ? JSON.parse(worker.skills) : [];
  
  const matchedSkills = taskSkills.filter(s => workerSkills.includes(s));
  score += matchedSkills.length * 20;
  
  if (task.latitude && task.longitude && worker.latitude && worker.longitude) {
    const distance = Math.sqrt(
      Math.pow(task.latitude - worker.latitude, 2) + 
      Math.pow(task.longitude - worker.longitude, 2)
    ) * 111;
    if (distance <= (task.radius || 5)) {
      score += 30;
    }
  }
  
  if (worker.credit_score >= 90) score += 15;
  else if (worker.credit_score >= 80) score += 10;
  else if (worker.credit_score >= 70) score += 5;
  
  return score;
};

router.get('/', authenticateOptional, (req, res) => {
  const { 
    page = 1, 
    pageSize = 20, 
    task_type, 
    category, 
    keyword,
    status,
    min_budget,
    max_budget,
    location,
    sort_by = 'created_at'
  } = req.query;
  
  let where = ['status = ?'];
  let params = ['published'];
  
  if (task_type) {
    where.push('task_type = ?');
    params.push(task_type);
  }
  if (category) {
    where.push('category = ?');
    params.push(category);
  }
  if (keyword) {
    where.push('(title LIKE ? OR description LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (min_budget) {
    where.push('budget >= ?');
    params.push(parseFloat(min_budget));
  }
  if (max_budget) {
    where.push('budget <= ?');
    params.push(parseFloat(max_budget));
  }
  if (location) {
    where.push('location LIKE ?');
    params.push(`%${location}%`);
  }
  
  const offset = (page - 1) * pageSize;
  const whereClause = where.join(' AND ');
  
🆔 身份核验 → 💪 开始工作 → 📤 履约提交 → 🔍 人工抽检 → ✅ 任务完成 → 💰 T+1结算🆔 身份核验 → 💪 开始工作 → 📤 履约提交 → 🔍 人工抽检 → ✅ 任务完成 → 💰 T+1结算🆔 身份核验 → 💪 开始工作 → 📤 履约提交 → 🔍 人工抽检 → ✅ 任务完成 → 💰 T+1结算🆔 身份核验 → 💪 开始工作 → 📤 履约提交 → 🔍 人工抽检 → ✅ 任务完成 → 💰 T+1结算  const tasks = db.prepare(`
    SELECT t.*, e.company_name, e.credit_rating,
           (SELECT COUNT(*) FROM orders o WHERE o.task_id = t.id AND o.status != 'cancelled') as accepted_count
    FROM tasks t
    LEFT JOIN employers e ON t.employer_id = e.id
    WHERE ${whereClause}
    ORDER BY ${sort_by} DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM tasks t WHERE ${whereClause}
  `).get(...params).count;
  
  res.json({
    data: tasks.map(t => ({
      ...t,
      skills_required: t.skills_required ? JSON.parse(t.skills_required) : []
    })),
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/recommended', authenticate, requireRole('student', 'homemaker', 'parttime'), (req, res) => {
  const worker = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  
  const tasks = db.prepare(`
    SELECT t.*, e.company_name, e.credit_rating
    FROM tasks t
    LEFT JOIN employers e ON t.employer_id = e.id
    WHERE t.status = 'published' 
      AND t.accepted_count < t.total_count
      AND NOT EXISTS (
        SELECT 1 FROM orders o 
        WHERE o.task_id = t.id AND o.worker_id = ? AND o.status != 'cancelled'
      )
    ORDER BY t.created_at DESC
    LIMIT 50
  `).all(req.user.id);
  
  const scoredTasks = tasks.map(task => ({
    ...task,
    skills_required: task.skills_required ? JSON.parse(task.skills_required) : [],
    match_score: calculateMatchScore(task, worker)
  }));
  
  scoredTasks.sort((a, b) => b.match_score - a.match_score);
  
  res.json({
    data: scoredTasks.slice(0, 20)
  });
});

router.get('/:id', authenticateOptional, (req, res) => {
  const task = db.prepare(`
    SELECT t.*, e.company_name, e.contact_name, e.contact_phone, e.credit_rating, e.verified as employer_verified
    FROM tasks t
    LEFT JOIN employers e ON t.employer_id = e.id
    WHERE t.id = ?
  `).get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  task.skills_required = task.skills_required ? JSON.parse(task.skills_required) : [];
  
  let hasAccepted = false;
  if (req.user) {
    hasAccepted = db.prepare(`
      SELECT COUNT(*) as count FROM orders 
      WHERE task_id = ? AND worker_id = ? AND status != 'cancelled'
    `).get(req.params.id, req.user.id).count > 0;
  }
  
  task.has_accepted = hasAccepted;
  
  res.json(task);
});

router.post('/', authenticate, requireRole('employer'), (req, res) => {
  const {
    title, description, task_type, category, skills_required,
    location, latitude, longitude, radius, budget, unit,
    total_count, start_time, end_time
  } = req.body;
  
  if (!title || !task_type || !category || budget === undefined) {
    return res.status(400).json({ error: '必填项不完整' });
  }
  
  const employer = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(req.user.id);
  
  if (!employer || !employer.verified) {
    return res.status(403).json({ error: '企业资质未审核通过，无法发布任务' });
  }
  
  const riskLevel = budget > 5000 || total_count > 100 ? 'high' : 
                    budget > 1000 || total_count > 20 ? 'medium' : 'low';
  
  const insertTask = db.prepare(`
    INSERT INTO tasks (
      employer_id, title, description, task_type, category,
      skills_required, location, latitude, longitude, radius,
      budget, unit, total_count, start_time, end_time,
      status, risk_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insertTask.run(
    employer.id,
    title,
    description || '',
    task_type,
    category,
    skills_required ? JSON.stringify(skills_required) : null,
    location || null,
    latitude || null,
    longitude || null,
    radius || 5,
    parseFloat(budget),
    unit || 'per_task',
    parseInt(total_count) || 1,
    start_time || null,
    end_time || null,
    'pending',
    riskLevel
  );
  
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'system', '任务已提交审核', `任务"${title}"已提交，等待平台审核`, result.lastInsertRowid);
  
  const admins = db.prepare("SELECT id FROM users WHERE user_type = 'admin'").all();
  admins.forEach(admin => {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(admin.id, 'task_review', '新任务待审核', `有新任务"${title}"需要审核`, result.lastInsertRowid);
  });
  
  res.json({
    id: result.lastInsertRowid,
    status: 'pending',
    message: '任务已提交，等待平台审核'
  });
});

router.post('/:id/accept', authenticate, requireRole('student', 'homemaker', 'parttime'), (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (task.status !== 'published') {
    return res.status(400).json({ error: '任务不可接单' });
  }
  
  const acceptedCount = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE task_id = ? AND status != 'cancelled'
  `).get(req.params.id).count;
  
  if (acceptedCount >= task.total_count) {
    return res.status(400).json({ error: '任务名额已满' });
  }
  
  const existingOrder = db.prepare(`
    SELECT * FROM orders WHERE task_id = ? AND worker_id = ? AND status != 'cancelled'
  `).get(req.params.id, req.user.id);
  
  if (existingOrder) {
    return res.status(400).json({ error: '您已接取此任务' });
  }
  
  const worker = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  
  if (!worker.id_verified) {
    return res.status(403).json({ error: '请先完成实名认证后再接单' });
  }
  
  const orderStatus = task.risk_level === 'high' ? 'accepted' : 'verified';
  
  const insertOrder = db.prepare(`
    INSERT INTO orders (task_id, worker_id, employer_id, status, amount)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const orderId = insertOrder.run(
    task.id,
    req.user.id,
    task.employer_id,
    orderStatus,
    task.budget
  ).lastInsertRowid;
  
  db.prepare(`
    UPDATE tasks SET accepted_count = accepted_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(task.id);
  
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'order', '接单成功', `您已成功接取任务"${task.title}"`, orderId);
  
  const employerUser = db.prepare(`
    SELECT u.id FROM users u
    JOIN employers e ON u.id = e.user_id
    WHERE e.id = ?
  `).get(task.employer_id);
  
  if (employerUser) {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(employerUser.id, 'order', '新的接单', `任务"${task.title}"有新的接单人`, orderId);
  }
  
  if (task.risk_level === 'high') {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, 'verification', '需要身份核验', '此任务需要完成身份核验后才能开始工作，请上传身份验证材料', orderId);
  }
  
  res.json({
    id: orderId,
    status: orderStatus,
    message: orderStatus === 'verified' ? '接单成功，可以开始工作' : '接单成功，请完成身份核验'
  });
});

module.exports = router;
