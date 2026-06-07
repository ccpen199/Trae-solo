const express = require('express');
const db = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');
const { screenResume } = require('../services/atsService');

const router = express.Router();

router.post('/', authenticateJWT, requireRole('jobseeker'), (req, res) => {
  const { job_id } = req.body;

  const profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(req.user.id);
  const resume = db.prepare('SELECT * FROM resumes WHERE job_seeker_id = ?').get(profile.id);
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job_id);

  if (!job) {
    return res.status(404).json({ error: '岗位不存在' });
  }

  if (!resume) {
    return res.status(400).json({ error: '请先完善简历' });
  }

  const existing = db.prepare('SELECT id FROM applications WHERE job_id = ? AND job_seeker_id = ?').get(job_id, profile.id);
  if (existing) {
    return res.status(400).json({ error: '已投递过该岗位' });
  }

  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO applications (job_id, job_seeker_id, resume_id, status)
      VALUES (?, ?, ?, 'applied')
    `).run(job_id, profile.id, resume.id);

    const atsResult = screenResume(info.lastInsertRowid, resume, job);

    db.prepare(`
      UPDATE applications SET status = 'screening', ats_score = ?
      WHERE id = ?
    `).run(atsResult.overallScore, info.lastInsertRowid);

    logAction('apply_job', req, 'application', info.lastInsertRowid,
      `投递岗位：${job.job_title}，ATS评分：${atsResult.overallScore}`);

    return { applicationId: info.lastInsertRowid, atsResult };
  });

  const result = tx();
  res.json(result);
});

router.get('/my-applications', authenticateJWT, requireRole('jobseeker'), (req, res) => {
  const profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(req.user.id);

  const applications = db.prepare(`
    SELECT a.*, j.job_title, j.salary_min, j.salary_max, j.city,
           e.enterprise_name, c.category_name
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN enterprises e ON j.enterprise_id = e.id
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    WHERE a.job_seeker_id = ?
    ORDER BY a.applied_at DESC
  `).all(profile.id);

  res.json({
    applications: applications.map(a => ({
      ...a,
      ats_keyword_match: a.ats_keyword_match ? JSON.parse(a.ats_keyword_match) : null,
      ats_semantic_analysis: a.ats_semantic_analysis ? JSON.parse(a.ats_semantic_analysis) : null,
    })),
  });
});

router.get('/for-enterprise', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);
  const { job_id, status, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT a.*, j.job_title, js.name, js.education, js.work_years,
           c.category_name
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN job_seekers js ON a.job_seeker_id = js.id
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    WHERE j.enterprise_id = ?
  `;
  const params = [req.user.role === 'admin' ? '%' : enterprise.id];

  if (req.user.role === 'admin') {
    sql = sql.replace('j.enterprise_id = ?', '1=1');
    params.shift();
  }

  if (job_id) {
    sql += ' AND a.job_id = ?';
    params.push(parseInt(job_id));
  }
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY a.ats_score DESC, a.applied_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), parseInt(offset));

  const applications = db.prepare(sql).all(...params);

  res.json({
    applications: applications.map(a => ({
      ...a,
      ats_keyword_match: a.ats_keyword_match ? JSON.parse(a.ats_keyword_match) : null,
      ats_semantic_analysis: a.ats_semantic_analysis ? JSON.parse(a.ats_semantic_analysis) : null,
    })),
  });
});

router.get('/:id', authenticateJWT, (req, res) => {
  const application = db.prepare(`
    SELECT a.*, j.*, js.name, js.phone, js.email, js.education, js.work_years,
           js.self_introduction, e.enterprise_name, e.industry, c.category_name
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN job_seekers js ON a.job_seeker_id = js.id
    JOIN enterprises e ON j.enterprise_id = e.id
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    WHERE a.id = ?
  `).get(req.params.id);

  if (!application) {
    return res.status(404).json({ error: '投递记录不存在' });
  }

  const resume = db.prepare('SELECT * FROM resumes WHERE job_seeker_id = ?').get(application.job_seeker_id);
  const certs = db.prepare('SELECT * FROM skill_certificates WHERE job_seeker_id = ?').all(application.job_seeker_id);
  const interviews = db.prepare('SELECT * FROM interviews WHERE application_id = ? ORDER BY interview_time DESC').all(req.params.id);

  res.json({
    application: {
      ...application,
      ats_keyword_match: application.ats_keyword_match ? JSON.parse(application.ats_keyword_match) : null,
      ats_semantic_analysis: application.ats_semantic_analysis ? JSON.parse(application.ats_semantic_analysis) : null,
      ability_model: application.ability_model ? JSON.parse(application.ability_model) : null,
    },
    resume: resume ? {
      ...resume,
      skills: resume.skills ? JSON.parse(resume.skills) : [],
      work_experience: resume.work_experience ? JSON.parse(resume.work_experience) : [],
      education_experience: resume.education_experience ? JSON.parse(resume.education_experience) : [],
      project_experience: resume.project_experience ? JSON.parse(resume.project_experience) : [],
    } : null,
    certificates: certs,
    interviews,
  });
});

router.put('/:id/status', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const { status } = req.body;

  const app = db.prepare(`
    SELECT a.*, j.enterprise_id FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!app) {
    return res.status(404).json({ error: '投递记录不存在' });
  }

  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);
  if (req.user.role !== 'admin' && (!enterprise || enterprise.id !== app.enterprise_id)) {
    return res.status(403).json({ error: '无权限操作' });
  }

  db.prepare(`
    UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, req.params.id);

  if (status === 'hired') {
    const existing = db.prepare('SELECT id FROM onboarding_records WHERE application_id = ?').get(req.params.id);
    if (!existing) {
      db.prepare(`
        INSERT INTO onboarding_records (application_id, job_seeker_id, enterprise_id, onboard_date)
        VALUES (?, ?, ?, DATE('now'))
      `).run(req.params.id, app.job_seeker_id, app.enterprise_id);
    }
  }

  logAction('update_application_status', req, 'application', req.params.id,
    `更新状态为：${status}`);

  res.json({ success: true });
});

router.post('/:id/ats-rescore', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const app = db.prepare(`
    SELECT a.*, j.*, r.* FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN resumes r ON a.resume_id = r.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!app) {
    return res.status(404).json({ error: '投递记录不存在' });
  }

  const result = screenResume(req.params.id, app, app);
  res.json(result);
});

module.exports = router;
