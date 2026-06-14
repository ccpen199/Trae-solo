const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticate, requireRole('admin'), (req, res) => {
  const userStats = db.prepare(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN user_type = 'student' THEN 1 ELSE 0 END) as student_count,
      SUM(CASE WHEN user_type = 'homemaker' THEN 1 ELSE 0 END) as homemaker_count,
      SUM(CASE WHEN user_type = 'parttime' THEN 1 ELSE 0 END) as parttime_count,
      SUM(CASE WHEN user_type = 'employer' THEN 1 ELSE 0 END) as employer_count,
      SUM(CASE WHEN id_verified = 1 THEN 1 ELSE 0 END) as verified_users,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users
    FROM users
  `).get();
  
  const taskStats = db.prepare(`
    SELECT
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_tasks,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
      SUM(CASE WHEN task_type = 'online' THEN 1 ELSE 0 END) as online_tasks,
      SUM(CASE WHEN task_type = 'offline' THEN 1 ELSE 0 END) as offline_tasks,
      SUM(CASE WHEN task_type = 'hybrid' THEN 1 ELSE 0 END) as hybrid_tasks,
      COALESCE(SUM(budget), 0) as total_budget
    FROM tasks
  `).get();
  
  const orderStats = db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_orders,
      SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing_orders,
      SUM(CASE WHEN spot_check = 1 THEN 1 ELSE 0 END) as spot_check_count,
      COALESCE(SUM(amount), 0) as total_amount
    FROM orders
  `).get();
  
  const settlementStats = db.prepare(`
    SELECT
      COALESCE(SUM(amount), 0) as total_transaction,
      COALESCE(SUM(platform_fee), 0) as total_platform_fee,
      COUNT(*) as total_settlements
    FROM settlements
  `).get();
  
  const pendingVerifications = db.prepare(`
    SELECT COUNT(*) as count FROM id_verifications WHERE status = 'pending'
  `).get().count;
  
  const pendingAppeals = db.prepare(`
    SELECT COUNT(*) as count FROM appeals WHERE status = 'pending'
  `).get().count;
  
  const pendingReviews = db.prepare(`
    SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'
  `).get().count;
  
  res.json({
    userStats,
    taskStats,
    orderStats,
    settlementStats,
    pendingCounts: {
      verifications: pendingVerifications,
      appeals: pendingAppeals,
      reviews: pendingReviews
    }
  });
});

router.get('/tasks/review', authenticate, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, status = 'pending' } = req.query;
  const offset = (page - 1) * pageSize;
  
  const tasks = db.prepare(`
    SELECT t.*, e.company_name, e.credit_rating, e.verified as employer_verified,
           u.username as employer_username, u.phone as employer_phone
    FROM tasks t
    JOIN employers e ON t.employer_id = e.id
    JOIN users u ON e.user_id = u.id
    WHERE t.status = ?
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(status, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM tasks WHERE status = ?
  `).get(status).count;
  
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

router.post('/tasks/:id/review', authenticate, requireRole('admin'), (req, res) => {
  const { status, review_note } = req.body;
  
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (task.status !== 'pending') {
    return res.status(400).json({ error: '任务状态不允许审核' });
  }
  
  if (!['published', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的审核状态' });
  }
  
  db.prepare(`
    UPDATE tasks SET 
      status = ?,
      review_note = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, review_note || '', req.params.id);
  
  db.prepare(`
    INSERT INTO task_reviews (task_id, reviewer_id, status, note)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.user.id, status, review_note || '');
  
  const employerUser = db.prepare(`
    SELECT u.id FROM users u
    JOIN employers e ON u.id = e.user_id
    WHERE e.id = ?
  `).get(task.employer_id);
  
  if (employerUser) {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      employerUser.id,
      'task_review',
      status === 'published' ? '任务审核通过' : '任务审核未通过',
      review_note || (status === 'published' ? '您的任务已发布' : '您的任务未通过审核，请修改后重新提交'),
      task.id
    );
  }
  
  res.json({ message: '审核完成' });
});

router.get('/employers', authenticate, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, verified } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (verified !== undefined) {
    where.push('e.verified = ?');
    params.push(parseInt(verified));
  }
  
  const whereClause = where.length ? where.join(' AND ') : '1=1';
  
  const employers = db.prepare(`
    SELECT e.*, u.username, u.real_name, u.phone, u.email, u.created_at,
           (SELECT COUNT(*) FROM tasks t WHERE t.employer_id = e.id) as task_count,
           (SELECT COUNT(*) FROM orders o WHERE o.employer_id = e.id) as order_count,
           (SELECT COALESCE(SUM(amount), 0) FROM orders o WHERE o.employer_id = e.id AND o.status = 'completed') as total_spent
    FROM employers e
    JOIN users u ON e.user_id = u.id
    WHERE ${whereClause}
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM employers e WHERE ${whereClause}
  `).get(...params).count;
  
  res.json({
    data: employers,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/employers/:id/verify', authenticate, requireRole('admin'), (req, res) => {
  const { verified, credit_rating, review_note } = req.body;
  
  const employer = db.prepare('SELECT * FROM employers WHERE id = ?').get(req.params.id);
  
  if (!employer) {
    return res.status(404).json({ error: '雇主不存在' });
  }
  
  db.prepare(`
    UPDATE employers SET 
      verified = ?,
      credit_rating = COALESCE(?, credit_rating),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(verified ? 1 : 0, credit_rating || null, req.params.id);
  
  db.prepare(`
    UPDATE users SET status = ? WHERE id = ?
  `).run(verified ? 'active' : 'suspended', employer.user_id);
  
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    employer.user_id,
    'system',
    verified ? '资质审核通过' : '资质审核未通过',
    review_note || (verified ? '您的企业资质已审核通过，可以发布任务' : '您的企业资质未通过审核'),
    employer.id
  );
  
  res.json({ message: '审核完成' });
});

router.get('/verifications', authenticate, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, status = 'pending' } = req.query;
  const offset = (page - 1) * pageSize;
  
  const verifications = db.prepare(`
    SELECT v.*, u.username, u.phone, u.user_type
    FROM id_verifications v
    JOIN users u ON v.user_id = u.id
    WHERE v.status = ?
    ORDER BY v.created_at DESC
    LIMIT ? OFFSET ?
  `).all(status, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM id_verifications WHERE status = ?
  `).get(status).count;
  
  res.json({
    data: verifications,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/verifications/:id/review', authenticate, requireRole('admin'), (req, res) => {
  const { status, review_note } = req.body;
  
  const verification = db.prepare('SELECT * FROM id_verifications WHERE id = ?').get(req.params.id);
  
  if (!verification) {
    return res.status(404).json({ error: '认证申请不存在' });
  }
  
  if (verification.status !== 'pending') {
    return res.status(400).json({ error: '认证申请状态不允许审核' });
  }
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的审核状态' });
  }
  
  db.prepare(`
    UPDATE id_verifications SET 
      status = ?,
      review_note = ?,
      reviewer_id = ?,
      reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, review_note || '', req.user.id, req.params.id);
  
  db.prepare(`
    UPDATE users SET 
      id_verified = ?,
      real_name = COALESCE(?, real_name),
      id_card = COALESCE(?, id_card),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status === 'approved' ? 1 : 0, verification.real_name, verification.id_card, verification.user_id);
  
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    verification.user_id,
    'verification',
    status === 'approved' ? '实名认证通过' : '实名认证未通过',
    review_note || (status === 'approved' ? '您的实名认证已通过' : '您的实名认证未通过，请重新提交'),
    verification.id
  );
  
  res.json({ message: '审核完成' });
});

router.get('/appeals', authenticate, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, status = 'pending' } = req.query;
  const offset = (page - 1) * pageSize;
  
  const appeals = db.prepare(`
    SELECT a.*, o.id as order_id, o.amount, t.title, t.task_type,
           u.username as appellant_name, u.phone as appellant_phone
    FROM appeals a
    JOIN orders o ON a.order_id = o.id
    JOIN tasks t ON o.task_id = t.id
    JOIN users u ON a.user_id = u.id
    WHERE a.status = ?
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(status, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM appeals WHERE status = ?
  `).get(status).count;
  
  res.json({
    data: appeals,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/appeals/:id/resolve', authenticate, requireRole('admin'), (req, res) => {
  const { status, resolution } = req.body;
  
  const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(req.params.id);
  
  if (!appeal) {
    return res.status(404).json({ error: '申诉不存在' });
  }
  
  if (appeal.status !== 'pending' && appeal.status !== 'reviewing') {
    return res.status(400).json({ error: '申诉状态不允许处理' });
  }
  
  if (!['resolved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的处理结果' });
  }
  
  db.prepare(`
    UPDATE appeals SET 
      status = ?,
      resolution = ?,
      handler_id = ?,
      resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, resolution || '', req.user.id, req.params.id);
  
  const newOrderStatus = status === 'resolved' ? 'completed' : (appeal.type === 'payment' ? 'completed' : 'rejected');
  db.prepare(`
    UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(newOrderStatus, appeal.order_id);
  
  if (status === 'resolved') {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(appeal.order_id);
    const platformFee = order.amount * 0.05;
    const workerAmount = order.amount - platformFee;
    
    const existingSettlement = db.prepare('SELECT id FROM settlements WHERE order_id = ?').get(order.id);
    if (!existingSettlement) {
      db.prepare(`
        INSERT INTO settlements (order_id, worker_id, employer_id, amount, platform_fee, worker_amount, status, settle_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, DATE('now', '+1 day'))
      `).run(order.id, order.worker_id, order.employer_id, order.amount, platformFee, workerAmount, 'pending');
    }
  }
  
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    appeal.user_id,
    'appeal',
    status === 'resolved' ? '申诉已解决' : '申诉已驳回',
    resolution || (status === 'resolved' ? '您的申诉已得到解决' : '您的申诉未通过审核'),
    appeal.id
  );
  
  res.json({ message: '申诉处理完成' });
});

router.get('/stats/heatmap', authenticate, requireRole('admin'), (req, res) => {
  const workerPerformance = db.prepare(`
    SELECT 
      u.id, u.username, u.real_name, u.location, u.latitude, u.longitude,
      u.user_type, u.credit_score,
      COUNT(o.id) as completed_orders,
      COALESCE(SUM(o.amount), 0) as total_earned,
      AVG(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completion_rate
    FROM users u
    LEFT JOIN orders o ON u.id = o.worker_id AND o.status = 'completed'
    WHERE u.user_type IN ('student', 'homemaker', 'parttime')
    GROUP BY u.id
    ORDER BY completed_orders DESC
    LIMIT 100
  `).all();
  
  res.json({
    data: workerPerformance
  });
});

router.get('/stats/region-demand', authenticate, requireRole('admin'), (req, res) => {
  const demandStats = db.prepare(`
    SELECT 
      COALESCE(t.location, '未指定') as region,
      COUNT(t.id) as task_count,
      SUM(t.total_count) as total_positions,
      SUM(t.accepted_count) as accepted_count,
      COALESCE(SUM(t.budget), 0) as total_budget,
      t.task_type
    FROM tasks t
    WHERE t.status = 'published' OR t.status = 'in_progress'
    GROUP BY t.location, t.task_type
    ORDER BY task_count DESC
  `).all();
  
  const categoryStats = db.prepare(`
    SELECT 
      t.category,
      COUNT(t.id) as task_count,
      SUM(t.total_count) as total_positions,
      COALESCE(SUM(t.budget), 0) as avg_budget
    FROM tasks t
    GROUP BY t.category
    ORDER BY task_count DESC
  `).all();
  
  res.json({
    regionDemand: demandStats,
    categoryDemand: categoryStats
  });
});

router.get('/stats/daily', authenticate, requireRole('admin'), (req, res) => {
  const { days = 30 } = req.query;
  
  const dailyStats = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      SUM(CASE WHEN user_type IN ('student', 'homemaker', 'parttime') THEN 1 ELSE 0 END) as new_workers,
      SUM(CASE WHEN user_type = 'employer' THEN 1 ELSE 0 END) as new_employers
    FROM users
    WHERE created_at >= DATE('now', '-? days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT ?
  `).all(parseInt(days), parseInt(days));
  
  const dailyTasks = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as new_tasks,
      COALESCE(SUM(budget), 0) as total_budget
    FROM tasks
    WHERE created_at >= DATE('now', '-? days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT ?
  `).all(parseInt(days), parseInt(days));
  
  const dailyOrders = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as new_orders,
      COALESCE(SUM(amount), 0) as total_amount
    FROM orders
    WHERE created_at >= DATE('now', '-? days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT ?
  `).all(parseInt(days), parseInt(days));
  
  res.json({
    dailyUsers: dailyStats,
    dailyTasks,
    dailyOrders
  });
});

router.get('/task-review', authenticate, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, status = 'pending' } = req.query;
  const offset = (page - 1) * pageSize;
  
  const tasks = db.prepare(`
    SELECT t.*, e.company_name, e.credit_rating, e.verified as employer_verified,
           u.username as employer_username, u.phone as employer_phone
    FROM tasks t
    JOIN employers e ON t.employer_id = e.id
    JOIN users u ON e.user_id = u.id
    WHERE t.status = ?
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(status, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM tasks WHERE status = ?
  `).get(status).count;
  
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

router.get('/tasks', authenticate, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (status) {
    where.push('t.status = ?');
    params.push(status);
  }
  
  const whereClause = where.length ? where.join(' AND ') : '1=1';
  
  const tasks = db.prepare(`
    SELECT t.*, e.company_name, u.username as employer_username
    FROM tasks t
    JOIN employers e ON t.employer_id = e.id
    JOIN users u ON e.user_id = u.id
    WHERE ${whereClause}
    ORDER BY t.created_at DESC
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

router.get('/users', authenticate, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, user_type } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (user_type) {
    where.push('user_type = ?');
    params.push(user_type);
  }
  
  const whereClause = where.length ? where.join(' AND ') : '1=1';
  
  const users = db.prepare(`
    SELECT u.*,
           (SELECT COUNT(*) FROM orders o WHERE o.worker_id = u.id) as order_count,
           (SELECT COUNT(*) FROM tasks t JOIN employers e ON t.employer_id = e.id WHERE e.user_id = u.id) as task_count
    FROM users u
    WHERE ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE ${whereClause}
  `).get(...params).count;
  
  res.json({
    data: users.map(u => ({
      ...u,
      skills: u.skills ? JSON.parse(u.skills) : [],
      available_hours: u.available_hours ? JSON.parse(u.available_hours) : []
    })),
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/stats', authenticate, requireRole('admin'), (req, res) => {
  const userStats = db.prepare(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN user_type = 'student' THEN 1 ELSE 0 END) as student_count,
      SUM(CASE WHEN user_type = 'homemaker' THEN 1 ELSE 0 END) as homemaker_count,
      SUM(CASE WHEN user_type = 'parttime' THEN 1 ELSE 0 END) as parttime_count,
      SUM(CASE WHEN user_type = 'employer' THEN 1 ELSE 0 END) as employer_count
    FROM users
  `).get();
  
  const taskStats = db.prepare(`
    SELECT
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_tasks,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
      SUM(CASE WHEN task_type = 'online' THEN 1 ELSE 0 END) as online_tasks,
      SUM(CASE WHEN task_type = 'offline' THEN 1 ELSE 0 END) as offline_tasks,
      SUM(CASE WHEN task_type = 'hybrid' THEN 1 ELSE 0 END) as hybrid_tasks,
      COALESCE(SUM(budget), 0) as total_budget
    FROM tasks
  `).get();
  
  const orderStats = db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
      COALESCE(SUM(amount), 0) as total_amount,
      COALESCE(AVG(amount), 0) as avg_order_amount
    FROM orders
  `).get();
  
  const regionStats = db.prepare(`
    SELECT 
      COALESCE(location, '未指定') as region,
      COUNT(*) as task_count,
      SUM(total_count) as total_positions
    FROM tasks
    GROUP BY location
    ORDER BY task_count DESC
    LIMIT 10
  `).all();
  
  res.json({
    userStats,
    taskStats,
    orderStats,
    regionStats
  });
});

module.exports = router;
