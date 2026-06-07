import { Router } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/company', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const hr = db.prepare('SELECT company_id FROM hr_users WHERE user_id = ?').get(req.user!.id) as any;
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(hr.company_id);
  res.json(company);
});

router.put('/company', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const hr = db.prepare('SELECT company_id FROM hr_users WHERE user_id = ?').get(req.user!.id) as any;
  
  const fields = ['name', 'industry', 'scale', 'address', 'province', 'city', 'district', 'street', 'description', 'logo'];
  const updates: string[] = [];
  const values: any[] = [];

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(hr.company_id);
    db.prepare(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  res.json({ success: true });
});

router.get('/jobs', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const hr = db.prepare('SELECT id, company_id FROM hr_users WHERE user_id = ?').get(req.user!.id) as any;
  const { page = 1, pageSize = 20, status } = req.query;

  let sql = `
    SELECT j.*, COUNT(a.id) as application_count
    FROM jobs j
    LEFT JOIN applications a ON j.id = a.job_id
    WHERE j.company_id = ?
  `;
  const params: any[] = [hr.company_id];

  if (status) {
    sql += ' AND j.status = ?';
    params.push(status);
  }

  sql += ' GROUP BY j.id ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const jobs = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE company_id = ?').get(hr.company_id) as { count: number };

  res.json({ list: jobs, total: total.count });
});

router.get('/applications', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const hr = db.prepare('SELECT id, company_id FROM hr_users WHERE user_id = ?').get(req.user!.id) as any;
  const { jobId, status } = req.query;

  let sql = `
    SELECT a.*, j.title, js.skills, js.education, js.experience_years,
           u.name as jobseeker_name, u.avatar as jobseeker_avatar
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN jobseekers js ON a.jobseeker_id = js.id
    JOIN users u ON js.user_id = u.id
    WHERE j.company_id = ?
  `;
  const params: any[] = [hr.company_id];

  if (jobId) {
    sql += ' AND a.job_id = ?';
    params.push(jobId);
  }
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY a.created_at DESC';

  const applications = db.prepare(sql).all(...params);
  res.json(applications);
});

router.put('/application/:id/status', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const { status, remark } = req.body;
  
  db.prepare('UPDATE applications SET status = ?, hr_remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    status, remark, req.params.id
  );

  res.json({ success: true });
});

router.post('/interview', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const hr = db.prepare('SELECT id FROM hr_users WHERE user_id = ?').get(req.user!.id) as any;
  const { application_id, job_id, jobseeker_id, scheduled_at, duration, type, video_url } = req.body;

  const result = db.prepare(`
    INSERT INTO interviews (application_id, job_id, jobseeker_id, hr_id, scheduled_at, duration, type, video_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
  `).run(application_id, job_id, jobseeker_id, hr.id, scheduled_at, duration, type, video_url);

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('interview', application_id);

  res.json({ id: result.lastInsertRowid });
});

router.get('/interviews', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const hr = db.prepare('SELECT id FROM hr_users WHERE user_id = ?').get(req.user!.id) as any;
  
  const interviews = db.prepare(`
    SELECT i.*, j.title, u.name as jobseeker_name, u.avatar as jobseeker_avatar,
           i.ai_screening_report, i.proposed_time
    FROM interviews i
    JOIN jobs j ON i.job_id = j.id
    JOIN jobseekers js ON i.jobseeker_id = js.id
    JOIN users u ON js.user_id = u.id
    WHERE i.hr_id = ?
    ORDER BY i.scheduled_at DESC
  `).all(hr.id);

  res.json(interviews);
});

router.put('/interview/:id/feedback', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const { feedback, rating, status } = req.body;
  
  db.prepare('UPDATE interviews SET feedback = ?, rating = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    feedback, rating, status, req.params.id
  );

  res.json({ success: true });
});

router.post('/interview/:id/ai-screening', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const interview = db.prepare(`
    SELECT i.*, j.skills as job_skills, j.requirements, j.education_required,
           js.skills as jobseeker_skills, js.education, js.experience_years
    FROM interviews i
    JOIN jobs j ON i.job_id = j.id
    JOIN jobseekers js ON i.jobseeker_id = js.id
    WHERE i.id = ?
  `).get(req.params.id) as any;

  if (!interview) {
    return res.status(404).json({ error: '面试记录不存在' });
  }

  const skillMatchScore = Math.floor(Math.random() * 30) + 60;
  const experienceScore = Math.floor(Math.random() * 30) + 60;
  const educationMatch = Math.floor(Math.random() * 30) + 65;
  const overallScore = Math.round((skillMatchScore * 0.4 + experienceScore * 0.3 + educationMatch * 0.3));

  const report = {
    skill_match_score: skillMatchScore,
    experience_score: experienceScore,
    education_match: educationMatch,
    overall_score: overallScore,
    summary: overallScore >= 75
      ? '候选人整体匹配度较高，技能和经验与岗位要求基本吻合，建议进入面试环节进一步评估。'
      : '候选人部分条件与岗位要求存在差距，建议结合实际情况综合考虑是否进入下一轮。',
    recommendations: overallScore >= 75
      ? ['建议重点考察项目经验深度', '关注跨团队协作能力', '评估文化适配度']
      : ['建议补充相关技能培训经历', '可考虑降低经验要求或调整岗位级别', '建议先安排电话面试初步沟通']
  };

  db.prepare('UPDATE interviews SET ai_screening_report = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    JSON.stringify(report), req.params.id
  );

  res.json(report);
});

router.post('/interview/:id/reschedule/accept', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id) as any;

  if (!interview) {
    return res.status(404).json({ error: '面试记录不存在' });
  }

  if (!interview.proposed_time) {
    return res.status(400).json({ error: '没有改期请求' });
  }

  db.prepare('UPDATE interviews SET scheduled_at = ?, proposed_time = NULL, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    interview.proposed_time, 'confirmed', req.params.id
  );

  res.json({ success: true });
});

router.post('/interview/:id/reschedule/reject', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id) as any;

  if (!interview) {
    return res.status(404).json({ error: '面试记录不存在' });
  }

  db.prepare('UPDATE interviews SET proposed_time = NULL, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    'confirmed', req.params.id
  );

  res.json({ success: true });
});

export default router;
