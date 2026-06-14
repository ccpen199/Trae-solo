const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get();
    const totalJobseekers = db.prepare('SELECT COUNT(*) as count FROM jobseekers').get();
    const totalEmployers = db.prepare('SELECT COUNT(*) as count FROM employers').get();
    const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get();
    
    const todayApplications = db.prepare(`
      SELECT COUNT(*) as count FROM applications 
      WHERE DATE(applied_at) = DATE('now')
    `).get();
    
    const avgMatchScore = db.prepare('SELECT AVG(match_score) as avg FROM applications').get();
    
    const exposureRate = db.prepare(`
      SELECT AVG(CAST(apply_count AS FLOAT) / (view_count + 1)) as rate FROM jobs WHERE view_count > 0
    `).get();

    const conversionRate = db.prepare(`
      SELECT CAST(COUNT(*) AS FLOAT) / (SELECT COUNT(*) FROM applications) as rate 
      FROM applications WHERE status IN ('accepted', 'hired')
    `).get();

    const avgOnboardingDays = db.prepare(`
      SELECT AVG(
        julianday(os.completed_at) - julianday(a.applied_at)
      ) as avg_days
      FROM onboarding_steps os
      JOIN applications a ON os.application_id = a.id
      WHERE os.step_type = 'onboarding' AND os.status = 'completed'
    `).get();

    res.json({
      stats: {
        totalJobs: totalJobs.count,
        totalJobseekers: totalJobseekers.count,
        totalEmployers: totalEmployers.count,
        totalApplications: totalApplications.count,
        todayApplications: todayApplications.count,
        avgMatchScore: Math.round(avgMatchScore.avg || 0),
        exposureRate: Math.round((exposureRate.rate || 0) * 100),
        conversionRate: Math.round((conversionRate.rate || 0) * 100),
        avgOnboardingDays: Math.round(avgOnboardingDays.avg_days || 0)
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: '获取仪表盘数据失败' });
  }
});

router.get('/employers/unverified', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const employers = db.prepare(`
      SELECT * FROM employers WHERE is_verified = 0 ORDER BY created_at DESC
    `).all();
    res.json({ employers });
  } catch (error) {
    res.status(500).json({ error: '获取未认证企业失败' });
  }
});

router.put('/employers/:id/verify', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    db.prepare('UPDATE employers SET is_verified = 1 WHERE id = ?').run(req.params.id);
    
    db.prepare(`
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, 'verify_employer', 'employer', req.params.id, '企业认证通过');

    res.json({ message: '认证成功' });
  } catch (error) {
    res.status(500).json({ error: '认证失败' });
  }
});

router.get('/reports', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT r.*, 
        CASE 
          WHEN r.reported_type = 'job' THEN (SELECT title FROM jobs WHERE id = r.reported_id)
          WHEN r.reported_type = 'message' THEN '消息举报'
          ELSE '其他'
        END as reported_title
      FROM reports r 
      ORDER BY r.created_at DESC
    `).all();
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: '获取举报列表失败' });
  }
});

router.put('/reports/:id/handle', authenticateToken, requireRole(['admin']), (req, res) => {
  const { status, action } = req.body;

  try {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    
    db.prepare(`
      UPDATE reports 
      SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status || 'handled', req.user.id, req.params.id);

    if (action === 'remove_job' && report.reported_type === 'job') {
      db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run('removed', report.reported_id);
    }

    db.prepare(`
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, 'handle_report', report.reported_type, report.reported_id, `处理举报: ${status}`);

    res.json({ message: '处理成功' });
  } catch (error) {
    res.status(500).json({ error: '处理失败' });
  }
});

router.get('/jobs/verify', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const jobs = db.prepare(`
      SELECT j.*, e.company_name, jv.is_fake, jv.duplicate_score
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      LEFT JOIN job_verifications jv ON j.id = jv.job_id
      ORDER BY j.created_at DESC
      LIMIT 50
    `).all();
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: '获取岗位验证列表失败' });
  }
});

router.post('/jobs/:id/check-duplicate', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const targetJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!targetJob) {
      return res.status(404).json({ error: '岗位不存在' });
    }

    const allJobs = db.prepare('SELECT id, title, description FROM jobs WHERE id != ?').all(req.params.id);
    
    let maxDuplicateScore = 0;
    allJobs.forEach(job => {
      const targetWords = (targetJob.title + ' ' + targetJob.description).split(/\s+/);
      const jobWords = (job.title + ' ' + job.description).split(/\s+/);
      const commonWords = targetWords.filter(w => jobWords.includes(w));
      const similarity = commonWords.length / Math.max(targetWords.length, jobWords.length, 1);
      maxDuplicateScore = Math.max(maxDuplicateScore, similarity);
    });

    const isFake = maxDuplicateScore > 0.8 ? 1 : 0;

    db.prepare(`
      INSERT OR REPLACE INTO job_verifications (job_id, is_fake, duplicate_score, checked_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(req.params.id, isFake, Math.round(maxDuplicateScore * 100));

    res.json({ duplicateScore: Math.round(maxDuplicateScore * 100), isFake });
  } catch (error) {
    res.status(500).json({ error: '查重失败' });
  }
});

router.get('/credit-records', authenticateToken, requireRole(['admin']), (req, res) => {
  const { jobseekerId } = req.query;
  
  try {
    let query = `
      SELECT cr.*, j.name as jobseeker_name
      FROM credit_records cr
      LEFT JOIN jobseekers j ON cr.jobseeker_id = j.id
    `;
    const params = [];
    
    if (jobseekerId) {
      query += ' WHERE cr.jobseeker_id = ?';
      params.push(jobseekerId);
    }
    
    query += ' ORDER BY cr.created_at DESC LIMIT 100';
    
    const records = db.prepare(query).all(...params);
    res.json({ records });
  } catch (error) {
    res.status(500).json({ error: '获取信用记录失败' });
  }
});

router.post('/credit-records', authenticateToken, requireRole(['admin']), (req, res) => {
  const { jobseekerId, type, scoreChange, reason } = req.body;

  try {
    db.prepare(`
      INSERT INTO credit_records (jobseeker_id, type, score_change, reason)
      VALUES (?, ?, ?, ?)
    `).run(jobseekerId, type, scoreChange, reason || '');

    db.prepare(`
      UPDATE jobseekers 
      SET credit_score = MAX(0, MIN(100, credit_score + ?))
      WHERE id = ?
    `).run(scoreChange, jobseekerId);

    res.json({ message: '信用记录添加成功' });
  } catch (error) {
    res.status(500).json({ error: '添加信用记录失败' });
  }
});

router.delete('/jobs/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
    
    db.prepare(`
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, 'delete_job', 'job', req.params.id, '管理员删除岗位');

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

router.get('/stats/public', (req, res) => {
  try {
    const jobseekers = db.prepare('SELECT COUNT(*) as count FROM jobseekers').get();
    const employers = db.prepare('SELECT COUNT(*) as count FROM employers WHERE is_verified = 1').get();
    const employersAll = db.prepare('SELECT COUNT(*) as count FROM employers').get();
    const jobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = ?').get('active');
    const totalViews = db.prepare('SELECT COALESCE(SUM(view_count), 0) as total FROM jobs').get();
    const totalApplies = db.prepare('SELECT COALESCE(SUM(apply_count), 0) as total FROM jobs').get();
    
    const hiredCount = db.prepare(`
      SELECT COUNT(*) as count FROM applications WHERE status = 'hired'
    `).get();
    const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get();
    const matchRate = totalApplications.count > 0 
      ? Math.round((hiredCount.count / totalApplications.count) * 100) 
      : 95;

    const interviewCount = db.prepare(`
      SELECT COUNT(*) as count FROM applications WHERE status IN ('interview', 'accepted', 'hired')
    `).get();
    const acceptedCount = db.prepare(`
      SELECT COUNT(*) as count FROM applications WHERE status IN ('accepted', 'hired')
    `).get();

    const unverifiedEmployerCount = db.prepare(`
      SELECT COUNT(*) as count FROM employers WHERE is_verified = 0
    `).get();
    const pendingReportCount = db.prepare(`
      SELECT COUNT(*) as count FROM reports WHERE status = 'pending'
    `).get();

    const exposureRate = totalViews.total > 0 
      ? Math.round((totalApplies.total / totalViews.total) * 100) 
      : 0;
    const conversionRate = totalApplies.total > 0 
      ? Math.round((hiredCount.count / totalApplies.total) * 100) 
      : 0;

    res.json({
      jobseekers: jobseekers.count || 0,
      employers: employers.count || 0,
      employersAll: employersAll.count || 0,
      unverifiedEmployers: unverifiedEmployerCount.count || 0,
      jobs: jobs.count || 0,
      matchRate: matchRate,
      totalViews: totalViews.total,
      totalApplies: totalApplies.total,
      exposureRate: exposureRate,
      conversionRate: conversionRate,
      funnel: {
        views: totalViews.total,
        applies: totalApplies.total,
        interviews: interviewCount.count,
        accepted: acceptedCount.count,
        hired: hiredCount.count
      },
      pendingReports: pendingReportCount.count,
      avgResponseTime: '12小时'
    });
  } catch (error) {
    console.error('Public stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/stats/employer', authenticateToken, requireRole(['employer']), (req, res) => {
  try {
    const employer = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(req.user.id);
    
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE employer_id = ?').get(employer.id);
    const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications WHERE employer_id = ?').get(employer.id);
    const totalViews = db.prepare('SELECT COALESCE(SUM(view_count), 0) as total FROM jobs WHERE employer_id = ?').get(employer.id);
    
    const exposureRate = totalViews.total > 0 
      ? Math.round((totalApplications.count / totalViews.total) * 100) 
      : 0;
    
    const conversionRate = totalApplications.count > 0
      ? Math.round((db.prepare("SELECT COUNT(*) as count FROM applications WHERE employer_id = ? AND status IN ('accepted', 'hired')").get(employer.id).count / totalApplications.count) * 100)
      : 0;

    const avgOnboardingDays = db.prepare(`
      SELECT AVG(
        julianday(os.completed_at) - julianday(a.applied_at)
      ) as avg_days
      FROM onboarding_steps os
      JOIN applications a ON os.application_id = a.id
      WHERE a.employer_id = ? AND os.step_type = 'onboarding' AND os.status = 'completed'
    `).get(employer.id);

    res.json({
      totalJobs: totalJobs.count,
      totalApplications: totalApplications.count,
      totalViews: totalViews.total,
      exposureRate,
      conversionRate,
      avgOnboardingDays: Math.round(avgOnboardingDays.avg_days || 0)
    });
  } catch (error) {
    res.status(500).json({ error: '获取招聘统计失败' });
  }
});

router.post('/reports', authenticateToken, (req, res) => {
  const { reportedType, reportedId, reason, description } = req.body;

  if (!reportedType || !reportedId || !reason) {
    return res.status(400).json({ error: '请填写完整举报信息' });
  }

  try {
    db.prepare(`
      INSERT INTO reports (reporter_id, reported_type, reported_id, reason, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, reportedType, reportedId, reason, description || '');

    res.json({ message: '举报已提交，我们会尽快处理' });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: '举报失败' });
  }
});

router.get('/my-reports', authenticateToken, (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT r.*,
        CASE 
          WHEN r.reported_type = 'job' THEN (SELECT title FROM jobs WHERE id = r.reported_id)
          ELSE '其他'
        END as reported_title
      FROM reports r 
      WHERE r.reporter_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: '获取举报记录失败' });
  }
});

module.exports = router;
