const { db } = require('../models/database');

function getCompanies(req, res) {
  const { page = 1, limit = 20, verified } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT c.*, u.username, u.email, u.created_at as user_created_at
    FROM companies c
    JOIN users u ON c.user_id = u.id
  `;
  let countSql = 'SELECT COUNT(*) as total FROM companies c JOIN users u ON c.user_id = u.id';
  let params = [];

  if (verified !== undefined) {
    sql += ' WHERE c.verified = ?';
    countSql += ' WHERE c.verified = ?';
    params.push(verified === 'true' ? 1 : 0);
  }

  sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const companies = db.prepare(sql).all(...params);
  const { total } = db.prepare(countSql).get(params.length > 2 ? [params[0]] : []);

  res.json({ companies, total, page: parseInt(page), limit: parseInt(limit) });
}

function updateCompanyCredit(req, res) {
  const companyId = req.params.id;
  const { creditScore, socialInsuranceRate, turnoverRate, verified } = req.body;

  const updateCompany = db.prepare(`
    UPDATE companies SET 
      credit_score = COALESCE(?, credit_score),
      social_insurance_rate = COALESCE(?, social_insurance_rate),
      turnover_rate = COALESCE(?, turnover_rate),
      verified = COALESCE(?, verified)
    WHERE id = ?
  `);

  updateCompany.run(creditScore, socialInsuranceRate, turnoverRate, verified, companyId);

  db.prepare(`
    INSERT INTO admin_actions (admin_id, action, target_type, target_id, note)
    VALUES (?, 'update_credit', 'company', ?, ?)
  `).run(req.user.id, companyId, `更新信用评分: ${creditScore}`);

  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
  res.json({ company });
}

function getPlatformStats(req, res) {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies').get();
  const totalJobseekers = db.prepare('SELECT COUNT(*) as count FROM jobseekers').get();
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE is_active = 1').get();
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get();
  const totalVideos = db.prepare('SELECT COUNT(*) as count FROM videos').get();
  const pendingVideos = db.prepare('SELECT COUNT(*) as count FROM videos WHERE status = ?').get('pending');
  const approvedVideos = db.prepare('SELECT COUNT(*) as count FROM videos WHERE status = ?').get('approved');
  const totalHired = db.prepare('SELECT COUNT(*) as count FROM applications WHERE status = ?').get('hired');

  const last7Days = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      SUM(CASE WHEN role = 'company' THEN 1 ELSE 0 END) as new_companies,
      SUM(CASE WHEN role = 'jobseeker' THEN 1 ELSE 0 END) as new_jobseekers
    FROM users
    WHERE created_at >= DATE('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all();

  res.json({
    overview: {
      totalUsers: totalUsers.count,
      totalCompanies: totalCompanies.count,
      totalJobseekers: totalJobseekers.count,
      totalJobs: totalJobs.count,
      totalApplications: totalApplications.count,
      totalHired: totalHired.count,
      totalVideos: totalVideos.count,
      pendingVideos: pendingVideos.count,
      approvedVideos: approvedVideos.count
    },
    last7Days
  });
}

function getCampusRecruitments(req, res) {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT cr.*, c.name as company_name, c.logo as company_logo
    FROM campus_recruitment cr
    JOIN companies c ON cr.company_id = c.id
  `;
  let countSql = 'SELECT COUNT(*) as total FROM campus_recruitment cr';
  let params = [];

  if (status) {
    sql += ' WHERE cr.status = ?';
    countSql += ' WHERE status = ?';
    params.push(status);
  }

  sql += ' ORDER BY cr.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const recruitments = db.prepare(sql).all(...params);
  const { total } = db.prepare(countSql).get(params.length > 2 ? [params[0]] : []);

  res.json({ recruitments, total, page: parseInt(page), limit: parseInt(limit) });
}

function reviewCampusRecruitment(req, res) {
  const id = req.params.id;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的审核状态' });
  }

  db.prepare('UPDATE campus_recruitment SET status = ? WHERE id = ?').run(status, id);

  db.prepare(`
    INSERT INTO admin_actions (admin_id, action, target_type, target_id, note)
    VALUES (?, ?, 'campus', ?, '')
  `).run(req.user.id, status === 'approved' ? 'campus_approve' : 'campus_reject', id);

  const recruitment = db.prepare('SELECT * FROM campus_recruitment WHERE id = ?').get(id);
  res.json({ recruitment });
}

function getPlatformFunnel(req, res) {
  const totalViews = db.prepare('SELECT SUM(views_count) as total FROM jobs').get();
  const appStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'viewed' THEN 1 ELSE 0 END) as viewed,
      SUM(CASE WHEN status = 'interview' THEN 1 ELSE 0 END) as interviews,
      SUM(CASE WHEN status = 'hired' THEN 1 ELSE 0 END) as hires
    FROM applications
  `).get();

  res.json({
    exposure: totalViews.total || 0,
    viewed: appStats.viewed || 0,
    applications: appStats.total || 0,
    interviews: appStats.interviews || 0,
    hires: appStats.hires || 0,
    pending: appStats.pending || 0
  });
}

function getAdminActions(req, res) {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const actions = db.prepare(`
    SELECT a.*, u.username as admin_name
    FROM admin_actions a
    LEFT JOIN users u ON a.admin_id = u.id
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(limit), parseInt(offset));

  const { total } = db.prepare('SELECT COUNT(*) as total FROM admin_actions').get();

  res.json({ actions, total, page: parseInt(page), limit: parseInt(limit) });
}

module.exports = {
  getCompanies,
  updateCompanyCredit,
  getPlatformStats,
  getCampusRecruitments,
  reviewCampusRecruitment,
  getPlatformFunnel,
  getAdminActions
};
