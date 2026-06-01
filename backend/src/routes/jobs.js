const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole, logBehavior } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireRole('hr'), (req, res) => {
  const jobs = db.prepare(`
    SELECT j.*, c.name as company_name, c.industry,
           (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.hr_id = ?
    ORDER BY j.created_at DESC
  `).all(req.user.id);

  jobs.forEach(j => {
    if (j.requirements) j.requirements = JSON.parse(j.requirements);
    if (j.office_images) j.office_images = JSON.parse(j.office_images);
  });

  res.json({ jobs });
});

router.post('/', authenticateToken, requireRole('hr'), logBehavior('create_job', 'job'), (req, res) => {
  const company = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(req.user.id);
  if (!company) {
    return res.status(404).json({ error: 'Company profile not found' });
  }

  const { title, description, requirements, salary_min, salary_max, city, location_lat, location_lng,
          address, work_type, experience_required, education_required, video_url, office_images, team_vlog_url } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Job title is required' });
  }

  const reqJson = requirements ? JSON.stringify(requirements) : null;
  const imagesJson = office_images ? JSON.stringify(office_images) : null;

  const result = db.prepare(`
    INSERT INTO jobs (company_id, hr_id, title, description, requirements, salary_min, salary_max,
                      city, location_lat, location_lng, address, work_type, experience_required,
                      education_required, video_url, office_images, team_vlog_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(company.id, req.user.id, title, description, reqJson, salary_min, salary_max,
         city, location_lat, location_lng, address, work_type, experience_required,
         education_required, video_url, imagesJson, team_vlog_url);

  res.json({ id: result.lastInsertRowid, message: 'Job created successfully' });
});

router.put('/:id', authenticateToken, requireRole('hr'), logBehavior('update_job', 'job'), (req, res) => {
  const jobId = req.params.id;
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND hr_id = ?').get(jobId, req.user.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const { title, description, requirements, salary_min, salary_max, city, location_lat, location_lng,
          address, work_type, experience_required, education_required, video_url, office_images, team_vlog_url, is_active } = req.body;

  const reqJson = requirements !== undefined ? JSON.stringify(requirements) : job.requirements;
  const imagesJson = office_images !== undefined ? JSON.stringify(office_images) : job.office_images;

  db.prepare(`
    UPDATE jobs SET 
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      requirements = ?,
      salary_min = COALESCE(?, salary_min),
      salary_max = COALESCE(?, salary_max),
      city = COALESCE(?, city),
      location_lat = COALESCE(?, location_lat),
      location_lng = COALESCE(?, location_lng),
      address = COALESCE(?, address),
      work_type = COALESCE(?, work_type),
      experience_required = COALESCE(?, experience_required),
      education_required = COALESCE(?, education_required),
      video_url = COALESCE(?, video_url),
      office_images = ?,
      team_vlog_url = COALESCE(?, team_vlog_url),
      is_active = COALESCE(?, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, description, reqJson, salary_min, salary_max, city, location_lat, location_lng,
         address, work_type, experience_required, education_required, video_url, imagesJson,
         team_vlog_url, is_active, jobId);

  res.json({ message: 'Job updated successfully' });
});

router.get('/:id', logBehavior('view_job', 'job'), (req, res) => {
  const jobId = req.params.id;

  const job = db.prepare(`
    SELECT j.*, c.name as company_name, c.industry, c.scale, c.description as company_description,
           u.username as hr_name, u.avatar as hr_avatar
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    JOIN users u ON j.hr_id = u.id
    WHERE j.id = ? AND j.is_active = 1
  `).get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  db.prepare('UPDATE jobs SET view_count = view_count + 1 WHERE id = ?').run(jobId);

  if (job.requirements) job.requirements = JSON.parse(job.requirements);
  if (job.office_images) job.office_images = JSON.parse(job.office_images);

  if (req.user) {
    db.prepare(`
      INSERT INTO browse_history (user_id, job_id)
      VALUES (?, ?)
    `).run(req.user.id, jobId);
  }

  res.json({ job });
});

router.get('/list/all', (req, res) => {
  const { page = 1, limit = 20, keyword, city, salary_min, salary_max, work_type, industry } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT j.*, c.name as company_name, c.industry, c.scale
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.is_active = 1
  `;
  const params = [];

  if (keyword) {
    sql += ' AND (j.title LIKE ? OR j.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (city) {
    sql += ' AND j.city = ?';
    params.push(city);
  }
  if (salary_min) {
    sql += ' AND j.salary_max >= ?';
    params.push(salary_min);
  }
  if (salary_max) {
    sql += ' AND j.salary_min <= ?';
    params.push(salary_max);
  }
  if (work_type) {
    sql += ' AND j.work_type = ?';
    params.push(work_type);
  }
  if (industry) {
    sql += ' AND c.industry LIKE ?';
    params.push(`%${industry}%`);
  }

  const countParams = [...params];

  sql += ' ORDER BY j.updated_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const jobs = db.prepare(sql).all(...params);
  
  jobs.forEach(j => {
    if (j.requirements) j.requirements = JSON.parse(j.requirements);
  });

  const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM').replace(/ORDER BY[\s\S]*$/, '');
  const { count = 0 } = db.prepare(countSql).get(...countParams) || {};

  res.json({ jobs, total: count, page: parseInt(page), limit: parseInt(limit) });
});

router.post('/:id/apply', authenticateToken, requireRole('jobseeker'), logBehavior('apply_job', 'job'), (req, res) => {
  const jobId = req.params.id;
  const { resume_id, message } = req.body;

  if (!resume_id) {
    return res.status(400).json({ error: 'Resume ID is required' });
  }

  const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND jobseeker_id = ?').get(resume_id, jobseeker.id);
  
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  const existing = db.prepare('SELECT id FROM job_applications WHERE job_id = ? AND resume_id = ?').get(jobId, resume_id);
  if (existing) {
    return res.status(400).json({ error: 'You have already applied for this job' });
  }

  db.prepare(`
    INSERT INTO job_applications (job_id, resume_id, jobseeker_id, message)
    VALUES (?, ?, ?, ?)
  `).run(jobId, resume_id, jobseeker.id, message);

  res.json({ message: 'Application submitted successfully' });
});

router.get('/applications/list', authenticateToken, (req, res) => {
  let applications;
  
  if (req.user.role === 'jobseeker') {
    const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
    applications = db.prepare(`
      SELECT ja.*, j.title as job_title, c.name as company_name, r.title as resume_title
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      JOIN resumes r ON ja.resume_id = r.id
      WHERE ja.jobseeker_id = ?
      ORDER BY ja.created_at DESC
    `).all(jobseeker.id);
  } else if (req.user.role === 'hr') {
    applications = db.prepare(`
      SELECT ja.*, j.title as job_title, js.real_name, r.title as resume_title, r.skills
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN resumes r ON ja.resume_id = r.id
      JOIN jobseekers js ON ja.jobseeker_id = js.id
      WHERE j.hr_id = ?
      ORDER BY ja.created_at DESC
    `).all(req.user.id);
    
    applications.forEach(a => {
      if (a.skills) a.skills = JSON.parse(a.skills);
    });
  }

  res.json({ applications });
});

router.put('/applications/:id/status', authenticateToken, requireRole('hr'), (req, res) => {
  const appId = req.params.id;
  const { status } = req.body;

  const application = db.prepare(`
    SELECT ja.* FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE ja.id = ? AND j.hr_id = ?
  `).get(appId, req.user.id);

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  db.prepare('UPDATE job_applications SET status = ? WHERE id = ?').run(status, appId);

  res.json({ message: 'Application status updated' });
});

module.exports = router;
