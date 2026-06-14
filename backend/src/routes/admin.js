
const express = require('express');
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { calculateReferrerCredibility, calculateCandidateCredibility } = require('../utils/credibility');

const router = express.Router();

router.get('/dashboard', authenticateToken, requireRole('admin'), (req, res) => {
  const stats = {
    total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    total_resumes: db.prepare('SELECT COUNT(*) as count FROM resumes').get().count,
    total_jobs: db.prepare('SELECT COUNT(*) as count FROM job_rewards WHERE status = ?').get('active').count,
    total_recommendations: db.prepare('SELECT COUNT(*) as count FROM recommendations').get().count,
    total_hires: db.prepare("SELECT COUNT(*) as count FROM recommendations WHERE status IN ('hired', 'probation', 'completed')").get().count,
    total_commission: db.prepare('SELECT SUM(amount) as total FROM transactions WHERE type = ? AND status = ?').get('commission', 'completed').total || 0,
    pending_recommendations: db.prepare("SELECT COUNT(*) as count FROM recommendations WHERE status = 'pending'").get().count,
    active_interviews: db.prepare("SELECT COUNT(*) as count FROM interviews WHERE status IN ('scheduled', 'active')").get().count
  };

  const recentRecommendations = db.prepare(`
    SELECT r.*, rc.candidate_name, jr.title as job_title, 
           c.company_name, u.real_name as referrer_name
    FROM recommendations r
    LEFT JOIN resumes rc ON r.resume_id = rc.id
    LEFT JOIN job_rewards jr ON r.job_id = jr.id
    LEFT JOIN companies c ON r.company_id = c.id
    LEFT JOIN users u ON r.referrer_id = u.id
    ORDER BY r.created_at DESC
    LIMIT 10
  `).all();

  const topReferrers = db.prepare(`
    SELECT u.id, u.real_name, u.credit_score, u.exposure_weight,
           u.total_recommendations, u.success_hires, u.total_commission
    FROM users u
    WHERE u.role = 'user'
    ORDER BY u.success_hires DESC, u.total_commission DESC
    LIMIT 10
  `).all();

  const hitRateAnalysis = db.prepare(`
    SELECT 
      u.id, u.real_name, u.credit_score, u.exposure_weight,
      COUNT(*) as total_recommendations,
      SUM(CASE WHEN r.status IN ('hired', 'probation', 'completed') THEN 1 ELSE 0 END) as success_hires,
      ROUND(
        CASE WHEN COUNT(*) > 0 
        THEN 100.0 * SUM(CASE WHEN r.status IN ('hired', 'probation', 'completed') THEN 1 ELSE 0 END) / COUNT(*)
        ELSE 0 END, 1
      ) as hit_rate
    FROM users u
    LEFT JOIN recommendations r ON u.id = r.referrer_id
    WHERE u.role = 'user'
    GROUP BY u.id
    HAVING total_recommendations > 0
    ORDER BY hit_rate DESC, total_recommendations DESC
    LIMIT 15
  `).all();

  const exposureAnalysis = db.prepare(`
    SELECT 
      credit_score,
      AVG(exposure_weight) as avg_exposure,
      COUNT(*) as user_count
    FROM users 
    WHERE role = 'user'
    GROUP BY credit_score
    ORDER BY credit_score DESC
  `).all();

  const fundingSupervision = db.prepare(`
    SELECT 
      COUNT(*) as total_contracts,
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
    FROM commission_plans
  `).get();

  const blockchainStats = db.prepare(`
    SELECT 
      contract_type,
      COUNT(*) as count,
      MAX(created_at) as latest_at
    FROM blockchain_records
    GROUP BY contract_type
  `).all();

  const recentTransactions = db.prepare(`
    SELECT t.*, 
           from_u.real_name as from_user_name,
           to_u.real_name as to_user_name,
           rc.candidate_name, jr.title as job_title
    FROM transactions t
    LEFT JOIN users from_u ON t.from_user_id = from_u.id
    LEFT JOIN users to_u ON t.to_user_id = to_u.id
    LEFT JOIN recommendations r ON t.recommendation_id = r.id
    LEFT JOIN resumes rc ON r.resume_id = rc.id
    LEFT JOIN job_rewards jr ON r.job_id = jr.id
    ORDER BY t.created_at DESC
    LIMIT 10
  `).all();

  res.json({
    stats,
    recent_recommendations: recentRecommendations,
    top_referrers: topReferrers,
    hit_rate_analysis: hitRateAnalysis,
    exposure_analysis: exposureAnalysis,
    funding_supervision: fundingSupervision,
    blockchain_stats: blockchainStats,
    recent_transactions: recentTransactions
  });
});

router.get('/users', authenticateToken, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, role, keyword } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (role) {
    whereClause += ' AND role = ?';
    params.push(role);
  }
  if (keyword) {
    whereClause += ' AND (username LIKE ? OR real_name LIKE ? OR phone LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params).count;

  const users = db.prepare(`
    SELECT u.*, c.company_name
    FROM users u
    LEFT JOIN companies c ON u.id = c.user_id
    ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ list: users, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/users/:id/credibility', authenticateToken, requireRole('admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  let credibility;
  if (user.role === 'user') {
    credibility = calculateReferrerCredibility(req.params.id);
  } else {
    credibility = calculateCandidateCredibility(req.params.id);
  }

  const history = db.prepare(`
    SELECT * FROM credibility_scores 
    WHERE user_id = ? 
    ORDER BY calculated_at DESC 
    LIMIT 20
  `).all(req.params.id);

  res.json({
    user_id: user.id,
    username: user.username,
    real_name: user.real_name,
    role: user.role,
    current_credit_score: user.credit_score,
    current_exposure_weight: user.exposure_weight,
    latest_calculation: credibility,
    history
  });
});

router.post('/users/:id/recalculate-credibility', authenticateToken, requireRole('admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  let result;
  if (user.role === 'user') {
    result = calculateReferrerCredibility(req.params.id);
  } else {
    result = calculateCandidateCredibility(req.params.id);
  }

  res.json({ success: true, result });
});

router.get('/transactions', authenticateToken, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, type, status, user_id } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (type) {
    whereClause += ' AND type = ?';
    params.push(type);
  }
  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  if (user_id) {
    whereClause += ' AND (from_user_id = ? OR to_user_id = ?)';
    params.push(user_id, user_id);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM transactions ${whereClause}`).get(...params).count;

  const transactions = db.prepare(`
    SELECT t.*, 
           from_u.real_name as from_user_name,
           to_u.real_name as to_user_name,
           rc.candidate_name, jr.title as job_title
    FROM transactions t
    LEFT JOIN users from_u ON t.from_user_id = from_u.id
    LEFT JOIN users to_u ON t.to_user_id = to_u.id
    LEFT JOIN recommendations r ON t.recommendation_id = r.id
    LEFT JOIN resumes rc ON r.resume_id = rc.id
    LEFT JOIN job_rewards jr ON r.job_id = jr.id
    ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ list: transactions, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/blockchain', authenticateToken, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, contract_type } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (contract_type) {
    whereClause += ' AND contract_type = ?';
    params.push(contract_type);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM blockchain_records ${whereClause}`).get(...params).count;

  const records = db.prepare(`
    SELECT * FROM blockchain_records ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ list: records, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/audit-logs', authenticateToken, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, user_id, action } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (user_id) {
    whereClause += ' AND user_id = ?';
    params.push(user_id);
  }
  if (action) {
    whereClause += ' AND action = ?';
    params.push(action);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`).get(...params).count;

  const logs = db.prepare(`
    SELECT a.*, u.real_name, u.username
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ list: logs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/statistics', authenticateToken, requireRole('admin'), (req, res) => {
  const { period = '30d' } = req.query;

  const daysMap = { '7d': 7, '30d': 30, '90d': 90, '180d': 180, '365d': 365 };
  const days = daysMap[period] || 30;

  const dailyRecommendations = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count,
      SUM(CASE WHEN status IN ('hired', 'probation', 'completed') THEN 1 ELSE 0 END) as success
    FROM recommendations
    WHERE created_at >= datetime('now', ?)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all(`-${days} days`);

  const dailyCommission = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      SUM(amount) as total
    FROM transactions
    WHERE type = 'commission' AND status = 'completed' AND created_at >= datetime('now', ?)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all(`-${days} days`);

  const statusDistribution = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM recommendations
    GROUP BY status
  `).all();

  const roleDistribution = db.prepare(`
    SELECT role, COUNT(*) as count
    FROM users
    GROUP BY role
  `).all();

  res.json({
    period,
    daily_recommendations: dailyRecommendations,
    daily_commission: dailyCommission,
    status_distribution: statusDistribution,
    role_distribution: roleDistribution
  });
});

router.get('/companies', authenticateToken, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, verified } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (verified !== undefined) {
    whereClause += ' AND verified = ?';
    params.push(verified === 'true' ? 1 : 0);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM companies ${whereClause}`).get(...params).count;

  const companies = db.prepare(`
    SELECT c.*, u.real_name as contact_name, u.phone, u.email, u.username
    FROM companies c
    LEFT JOIN users u ON c.user_id = u.id
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ list: companies, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/companies/:id/verify', authenticateToken, requireRole('admin'), (req, res) => {
  const { verified } = req.body;

  db.prepare('UPDATE companies SET verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    verified ? 1 : 0, req.params.id
  );

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip, details)
    VALUES (?, 'verify_company', 'company', ?, ?, ?)
  `).run(req.user.id, req.params.id, req.ip, JSON.stringify({ verified: verified ? 1 : 0 }));

  res.json({ message: '操作成功' });
});

module.exports = router;
