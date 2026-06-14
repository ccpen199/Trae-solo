
const express = require('express');
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 20, keyword, city, company_id, min_reward } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE jr.status = ?';
  const params = ['active'];

  if (keyword) {
    whereClause += ' AND (jr.title LIKE ? OR jr.job_description LIKE ? OR jr.requirements LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (city) {
    whereClause += ' AND jr.city = ?';
    params.push(city);
  }
  if (company_id) {
    whereClause += ' AND jr.company_id = ?';
    params.push(company_id);
  }
  if (min_reward) {
    whereClause += ' AND jr.reward_amount >= ?';
    params.push(parseFloat(min_reward));
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM job_rewards jr ${whereClause}`).get(...params).count;

  const jobs = db.prepare(`
    SELECT jr.*, c.company_name, c.industry, c.verified,
           u.real_name as creator_name, u.credit_score as creator_credit
    FROM job_rewards jr
    LEFT JOIN companies c ON jr.company_id = c.id
    LEFT JOIN users u ON jr.created_by = u.id
    ${whereClause}
    ORDER BY jr.reward_amount DESC, jr.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset).map(j => ({
    ...j,
    commission_tiers: j.commission_tiers ? JSON.parse(j.commission_tiers) : [],
    installment_plan: j.installment_plan ? JSON.parse(j.installment_plan) : [],
    allowed_channels: j.allowed_channels ? JSON.parse(j.allowed_channels) : [],
    feedback_nodes: j.feedback_nodes ? JSON.parse(j.feedback_nodes) : []
  }));

  res.json({ list: jobs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/mine', authenticateToken, requireRole('company', 'admin'), (req, res) => {
  const company = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(req.user.id);
  
  if (!company && req.user.role !== 'admin') {
    return res.status(403).json({ error: '您不是企业用户' });
  }

  const jobs = db.prepare(`
    SELECT jr.*, c.company_name
    FROM job_rewards jr
    LEFT JOIN companies c ON jr.company_id = c.id
    WHERE jr.created_by = ? OR jr.company_id = ?
    ORDER BY jr.created_at DESC
  `).all(req.user.id, company?.id).map(j => ({
    ...j,
    commission_tiers: j.commission_tiers ? JSON.parse(j.commission_tiers) : [],
    installment_plan: j.installment_plan ? JSON.parse(j.installment_plan) : [],
    allowed_channels: j.allowed_channels ? JSON.parse(j.allowed_channels) : [],
    feedback_nodes: j.feedback_nodes ? JSON.parse(j.feedback_nodes) : []
  }));

  res.json(jobs);
});

router.get('/:id', authenticateToken, (req, res) => {
  const job = db.prepare(`
    SELECT jr.*, c.company_name, c.industry, c.scale, c.description, c.verified,
           u.real_name as creator_name
    FROM job_rewards jr
    LEFT JOIN companies c ON jr.company_id = c.id
    LEFT JOIN users u ON jr.created_by = u.id
    WHERE jr.id = ?
  `).get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  job.commission_tiers = job.commission_tiers ? JSON.parse(job.commission_tiers) : [];
  job.installment_plan = job.installment_plan ? JSON.parse(job.installment_plan) : [];
  job.allowed_channels = job.allowed_channels ? JSON.parse(job.allowed_channels) : [];
  job.feedback_nodes = job.feedback_nodes ? JSON.parse(job.feedback_nodes) : [];

  res.json(job);
});

router.post('/', authenticateToken, requireRole('company', 'admin'), (req, res) => {
  const {
    title, department, job_description, requirements,
    salary_min, salary_max, reward_amount, commission_tiers,
    installment_plan, allowed_channels, probation_months, feedback_nodes, city
  } = req.body;

  if (!title || !reward_amount) {
    return res.status(400).json({ error: '职位名称和赏金金额不能为空' });
  }

  const company = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(req.user.id);
  if (!company && req.user.role !== 'admin') {
    return res.status(403).json({ error: '请先完成企业认证' });
  }

  const stmt = db.prepare(`
    INSERT INTO job_rewards (
      company_id, title, department, job_description, requirements,
      salary_min, salary_max, reward_amount, commission_tiers,
      installment_plan, allowed_channels, probation_months, feedback_nodes,
      city, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tiersStr = JSON.stringify(commission_tiers || [{ threshold: 1, rate: 0.1 }]);
  const installmentsStr = JSON.stringify(installment_plan || [
    { month: 1, ratio: 0.3 },
    { month: 3, ratio: 0.4 },
    { month: 6, ratio: 0.3 }
  ]);
  const channelsStr = JSON.stringify(allowed_channels || ['internal']);
  const feedbackStr = JSON.stringify(feedback_nodes || ['1个月', '3个月', '6个月']);

  const info = stmt.run(
    company?.id || 1, title, department, job_description, requirements,
    salary_min, salary_max, reward_amount, tiersStr,
    installmentsStr, channelsStr, probation_months || 3, feedbackStr,
    city, req.user.id
  );

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip)
    VALUES (?, 'create_job', 'job', ?, ?)
  `).run(req.user.id, info.lastInsertRowid, req.ip);

  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', authenticateToken, requireRole('company', 'admin'), (req, res) => {
  const job = db.prepare('SELECT * FROM job_rewards WHERE id = ?').get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  if (job.created_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限修改此职位' });
  }

  const {
    title, department, job_description, requirements,
    salary_min, salary_max, reward_amount, commission_tiers,
    installment_plan, allowed_channels, probation_months, feedback_nodes,
    city, status
  } = req.body;

  db.prepare(`
    UPDATE job_rewards SET
      title = ?, department = ?, job_description = ?, requirements = ?,
      salary_min = ?, salary_max = ?, reward_amount = ?, commission_tiers = ?,
      installment_plan = ?, allowed_channels = ?, probation_months = ?,
      feedback_nodes = ?, city = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title, department, job_description, requirements,
    salary_min, salary_max, reward_amount,
    JSON.stringify(commission_tiers), JSON.stringify(installment_plan),
    JSON.stringify(allowed_channels), probation_months,
    JSON.stringify(feedback_nodes), city, status, req.params.id
  );

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip)
    VALUES (?, 'update_job', 'job', ?, ?)
  `).run(req.user.id, req.params.id, req.ip);

  res.json({ message: '更新成功' });
});

router.delete('/:id', authenticateToken, requireRole('company', 'admin'), (req, res) => {
  const job = db.prepare('SELECT * FROM job_rewards WHERE id = ?').get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  if (job.created_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限删除此职位' });
  }

  db.prepare('UPDATE job_rewards SET status = ? WHERE id = ?').run('closed', req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip, details)
    VALUES (?, 'close_job', 'job', ?, ?, ?)
  `).run(req.user.id, req.params.id, req.ip, JSON.stringify({ status: 'closed' }));

  res.json({ message: '职位已关闭' });
});

module.exports = router;
