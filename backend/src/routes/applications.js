const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { calculateMatchScore } = require('../utils/matching');

const router = express.Router();

router.post('/', authenticateToken, requireRole(['jobseeker']), (req, res) => {
  const { jobId } = req.body;

  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    if (!job) {
      return res.status(404).json({ error: '岗位不存在' });
    }

    const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
    
    const existing = db.prepare('SELECT * FROM applications WHERE job_id = ? AND jobseeker_id = ?').get(jobId, jobseeker.id);
    if (existing) {
      return res.status(400).json({ error: '已投递过该岗位' });
    }

    const jobSkills = db.prepare('SELECT skill FROM job_skills WHERE job_id = ?').all(jobId);
    const employer = db.prepare('SELECT rating as company_rating FROM employers WHERE id = ?').get(job.employer_id);
    const jobWithRating = { ...job, company_rating: employer?.rating };
    
    const score = calculateMatchScore(jobseeker, jobWithRating, jobSkills);

    db.prepare(`
      INSERT INTO applications (job_id, jobseeker_id, employer_id, status, match_score)
      VALUES (?, ?, ?, ?, ?)
    `).run(jobId, jobseeker.id, job.employer_id, 'pending', score);

    db.prepare('UPDATE jobs SET apply_count = apply_count + 1 WHERE id = ?').run(jobId);

    const steps = ['interview', 'offer', 'contract', 'onboarding'];
    const insertStep = db.prepare(`
      INSERT INTO onboarding_steps (application_id, step_type, status)
      VALUES (?, ?, 'pending')
    `);
    const appId = db.prepare('SELECT last_insert_rowid() as id').get().id;
    steps.forEach(step => insertStep.run(appId, step));

    res.json({ message: '投递成功' });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ error: '投递失败' });
  }
});

router.get('/my', authenticateToken, (req, res) => {
  try {
    let applications = [];
    
    if (req.user.role === 'jobseeker') {
      const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
      applications = db.prepare(`
        SELECT a.*, j.title, j.location, j.salary_min, j.salary_max, e.company_name
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN employers e ON a.employer_id = e.id
        WHERE a.jobseeker_id = ?
        ORDER BY a.applied_at DESC
      `).all(jobseeker.id);
    } else if (req.user.role === 'employer') {
      const employer = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(req.user.id);
      applications = db.prepare(`
        SELECT a.*, j.title, js.name as jobseeker_name, js.phone, js.education
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN jobseekers js ON a.jobseeker_id = js.id
        WHERE a.employer_id = ?
        ORDER BY a.applied_at DESC
      `).all(employer.id);
    }

    res.json({ applications });
  } catch (error) {
    res.status(500).json({ error: '获取申请列表失败' });
  }
});

router.put('/:id/status', authenticateToken, requireRole(['employer']), (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'reviewing', 'interview', 'accepted', 'rejected', 'hired'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效状态' });
  }

  try {
    const employer = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(req.user.id);
    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);

    if (!application) {
      return res.status(404).json({ error: '申请不存在' });
    }
    if (application.employer_id !== employer.id) {
      return res.status(403).json({ error: '无权操作' });
    }

    db.prepare('UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);

    res.json({ message: '状态更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新状态失败' });
  }
});

router.get('/:id/onboarding', authenticateToken, (req, res) => {
  try {
    const steps = db.prepare('SELECT * FROM onboarding_steps WHERE application_id = ? ORDER BY id').all(req.params.id);
    res.json({ steps });
  } catch (error) {
    res.status(500).json({ error: '获取入职进度失败' });
  }
});

router.put('/onboarding/:stepId', authenticateToken, (req, res) => {
  const { status, scheduledAt, notes } = req.body;

  try {
    const step = db.prepare('SELECT * FROM onboarding_steps WHERE id = ?').get(req.params.stepId);
    if (!step) {
      return res.status(404).json({ error: '步骤不存在' });
    }

    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(step.application_id);
    
    if (req.user.role === 'employer') {
      const employer = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(req.user.id);
      if (application.employer_id !== employer.id) {
        return res.status(403).json({ error: '无权操作' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权操作' });
    }

    db.prepare(`
      UPDATE onboarding_steps 
      SET status = ?, scheduled_at = ?, notes = ?, completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = ?
    `).run(status || 'pending', scheduledAt || null, notes || '', status, req.params.stepId);

    res.json({ message: '步骤更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新步骤失败' });
  }
});

module.exports = router;
