const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole, logBehavior } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireRole('jobseeker'), (req, res) => {
  const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
  if (!jobseeker) {
    return res.status(404).json({ error: 'Jobseeker profile not found' });
  }

  const resumes = db.prepare(`
    SELECT r.*, 
           (SELECT COUNT(*) FROM job_applications WHERE resume_id = r.id) as application_count
    FROM resumes r 
    WHERE r.jobseeker_id = ?
    ORDER BY r.created_at DESC
  `).all(jobseeker.id);

  resumes.forEach(r => {
    if (r.skills) r.skills = JSON.parse(r.skills);
  });

  res.json({ resumes });
});

router.post('/', authenticateToken, requireRole('jobseeker'), logBehavior('create_resume', 'resume'), (req, res) => {
  const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
  if (!jobseeker) {
    return res.status(404).json({ error: 'Jobseeker profile not found' });
  }

  const { title, skills, expected_salary_min, expected_salary_max, available_date, work_experience, education_experience, self_intro } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Resume title is required' });
  }

  const skillsJson = skills ? JSON.stringify(skills) : null;
  const workExpJson = work_experience ? JSON.stringify(work_experience) : null;
  const eduExpJson = education_experience ? JSON.stringify(education_experience) : null;

  const result = db.prepare(`
    INSERT INTO resumes (jobseeker_id, title, skills, expected_salary_min, expected_salary_max,
                         available_date, work_experience, education_experience, self_intro)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(jobseeker.id, title, skillsJson, expected_salary_min, expected_salary_max,
         available_date, workExpJson, eduExpJson, self_intro);

  res.json({ id: result.lastInsertRowid, message: 'Resume created successfully' });
});

router.put('/:id', authenticateToken, requireRole('jobseeker'), logBehavior('update_resume', 'resume'), (req, res) => {
  const resumeId = req.params.id;
  const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
  
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND jobseeker_id = ?').get(resumeId, jobseeker.id);
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  const { title, skills, expected_salary_min, expected_salary_max, available_date, work_experience, education_experience, self_intro, is_active } = req.body;

  const skillsJson = skills !== undefined ? JSON.stringify(skills) : resume.skills;
  const workExpJson = work_experience !== undefined ? JSON.stringify(work_experience) : resume.work_experience;
  const eduExpJson = education_experience !== undefined ? JSON.stringify(education_experience) : resume.education_experience;

  db.prepare(`
    UPDATE resumes SET 
      title = COALESCE(?, title),
      skills = ?,
      expected_salary_min = COALESCE(?, expected_salary_min),
      expected_salary_max = COALESCE(?, expected_salary_max),
      available_date = COALESCE(?, available_date),
      work_experience = ?,
      education_experience = ?,
      self_intro = COALESCE(?, self_intro),
      is_active = COALESCE(?, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, skillsJson, expected_salary_min, expected_salary_max, available_date,
         workExpJson, eduExpJson, self_intro, is_active, resumeId);

  res.json({ message: 'Resume updated successfully' });
});

router.get('/:id', logBehavior('view_resume', 'resume'), (req, res) => {
  const resumeId = req.params.id;

  const resume = db.prepare(`
    SELECT r.*, j.real_name, j.avatar as jobseeker_avatar, j.city, j.work_years, j.education,
           u.username
    FROM resumes r
    JOIN jobseekers j ON r.jobseeker_id = j.id
    JOIN users u ON j.user_id = u.id
    WHERE r.id = ? AND r.is_active = 1
  `).get(resumeId);

  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  db.prepare('UPDATE resumes SET view_count = view_count + 1 WHERE id = ?').run(resumeId);

  if (resume.skills) resume.skills = JSON.parse(resume.skills);
  if (resume.work_experience) resume.work_experience = JSON.parse(resume.work_experience);
  if (resume.education_experience) resume.education_experience = JSON.parse(resume.education_experience);

  res.json({ resume });
});

router.get('/list/all', (req, res) => {
  const { page = 1, limit = 20, keyword, city, skill, salary_min } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT r.*, j.real_name, j.avatar as jobseeker_avatar, j.city, j.work_years, j.education
    FROM resumes r
    JOIN jobseekers j ON r.jobseeker_id = j.id
    WHERE r.is_active = 1
  `;
  const params = [];

  if (keyword) {
    sql += ' AND (r.title LIKE ? OR r.self_intro LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (city) {
    sql += ' AND j.city = ?';
    params.push(city);
  }
  if (skill) {
    sql += ' AND r.skills LIKE ?';
    params.push(`%${skill}%`);
  }
  if (salary_min) {
    sql += ' AND r.expected_salary_max >= ?';
    params.push(salary_min);
  }

  const countParams = [...params];

  sql += ' ORDER BY r.updated_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const resumes = db.prepare(sql).all(...params);
  
  resumes.forEach(r => {
    if (r.skills) r.skills = JSON.parse(r.skills);
  });

  const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM').replace(/ORDER BY[\s\S]*$/, '');
  const { count = 0 } = db.prepare(countSql).get(...countParams) || {};

  res.json({ resumes, total: count, page: parseInt(page), limit: parseInt(limit) });
});

module.exports = router;
