import { Router } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/profile', authMiddleware, roleMiddleware('jobseeker'), (req: AuthRequest, res) => {
  const profile = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user!.id);
  res.json(profile);
});

router.put('/profile', authMiddleware, roleMiddleware('jobseeker'), (req: AuthRequest, res) => {
  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user!.id) as any;
  
  const fields = [
    'gender', 'birth_date', 'education', 'experience_years',
    'expected_salary_min', 'expected_salary_max', 'expected_city',
    'resume', 'skills', 'certificates', 'portfolio'
  ];

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
    values.push(jobseeker.id);
    db.prepare(`UPDATE jobseekers SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    if (req.body.skills) {
      const skills = JSON.parse(req.body.skills || '[]');
      const insertSkill = db.prepare('INSERT OR REPLACE INTO skill_weights (jobseeker_id, skill, weight, source) VALUES (?, ?, ?, ?)');
      skills.forEach((skill: string) => {
        insertSkill.run(jobseeker.id, skill, 0.8, 'profile');
      });
    }
  }

  res.json({ success: true });
});

router.post('/apply/:jobId', authMiddleware, roleMiddleware('jobseeker'), (req: AuthRequest, res) => {
  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user!.id) as any;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND status = ?').get(req.params.jobId, 'active');

  if (!job) {
    return res.status(404).json({ error: '职位不存在或已关闭' });
  }

  try {
    db.prepare('INSERT INTO applications (job_id, jobseeker_id, status) VALUES (?, ?, ?)').run(
      req.params.jobId, jobseeker.id, 'pending'
    );
    db.prepare('UPDATE jobs SET apply_count = apply_count + 1 WHERE id = ?').run(req.params.jobId);
    res.json({ success: true });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: '已申请过该职位' });
    }
    throw error;
  }
});

router.get('/applications', authMiddleware, roleMiddleware('jobseeker'), (req: AuthRequest, res) => {
  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user!.id) as any;
  
  const applications = db.prepare(`
    SELECT a.*, j.title, j.salary_min, j.salary_max, j.city, 
           c.name as company_name, c.logo as company_logo
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE a.jobseeker_id = ?
    ORDER BY a.created_at DESC
  `).all(jobseeker.id);

  res.json(applications);
});

router.get('/interviews', authMiddleware, roleMiddleware('jobseeker'), (req: AuthRequest, res) => {
  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user!.id) as any;
  
  const interviews = db.prepare(`
    SELECT i.*, j.title, c.name as company_name, u.name as hr_name
    FROM interviews i
    JOIN jobs j ON i.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    JOIN hr_users hr ON i.hr_id = hr.id
    JOIN users u ON hr.user_id = u.id
    WHERE i.jobseeker_id = ?
    ORDER BY i.scheduled_at DESC
  `).all(jobseeker.id);

  res.json(interviews);
});

router.post('/interview/:id/confirm', authMiddleware, roleMiddleware('jobseeker'), (req: AuthRequest, res) => {
  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user!.id) as any;
  
  db.prepare('UPDATE interviews SET status = ? WHERE id = ? AND jobseeker_id = ?').run(
    'confirmed', req.params.id, jobseeker.id
  );

  res.json({ success: true });
});

router.post('/interview/:id/reschedule', authMiddleware, roleMiddleware('jobseeker'), (req: AuthRequest, res) => {
  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user!.id) as any;
  const { proposed_time } = req.body;

  if (!proposed_time) {
    return res.status(400).json({ error: '请提供期望的面试时间' });
  }

  const interview = db.prepare('SELECT * FROM interviews WHERE id = ? AND jobseeker_id = ?').get(req.params.id, jobseeker.id) as any;

  if (!interview) {
    return res.status(404).json({ error: '面试记录不存在' });
  }

  db.prepare('UPDATE interviews SET proposed_time = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    proposed_time, 'reschedule_requested', req.params.id
  );

  res.json({ success: true });
});

router.get('/skill-graph', authMiddleware, roleMiddleware('jobseeker'), (req: AuthRequest, res) => {
  const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user!.id) as any;
  
  if (!jobseeker) {
    return res.status(404).json({ error: '求职者信息不存在' });
  }

  const skillWeights = db.prepare(`
    SELECT skill, weight, source FROM skill_weights 
    WHERE jobseeker_id = ? 
    ORDER BY weight DESC
  `).all(jobseeker.id) as { skill: string; weight: number; source: string }[];

  let profileSkills: string[] = [];
  try {
    profileSkills = JSON.parse(jobseeker.skills || '[]');
  } catch {
    profileSkills = [];
  }

  const allSkillNames = new Set<string>();
  skillWeights.forEach(s => allSkillNames.add(s.skill));
  profileSkills.forEach(s => allSkillNames.add(s));

  const skillMap = new Map<string, { skill: string; weight: number; source: string }>();
  skillWeights.forEach(s => {
    skillMap.set(s.skill, s);
  });

  profileSkills.forEach(s => {
    if (!skillMap.has(s)) {
      skillMap.set(s, { skill: s, weight: 0.5, source: 'profile' });
    }
  });

  const skills = Array.from(skillMap.values()).sort((a, b) => b.weight - a.weight);

  res.json({
    skills,
    profile: {
      experience_years: jobseeker.experience_years,
      education: jobseeker.education,
      expected_salary_min: jobseeker.expected_salary_min,
      expected_salary_max: jobseeker.expected_salary_max,
      expected_city: jobseeker.expected_city,
      gender: jobseeker.gender
    }
  });
});

export default router;
