const { db } = require('../models/database');

function createJob(req, res) {
  const { title, description, salaryMin, salaryMax, location, skills, experienceRequired, educationRequired, videoId, videoResumeEnabled } = req.body;

  if (!title || !salaryMin || !salaryMax) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id);
  if (!company) {
    return res.status(404).json({ error: '企业信息不存在' });
  }

  const insertJob = db.prepare(`
    INSERT INTO jobs (company_id, title, description, salary_min, salary_max, location, skills, experience_required, education_required, video_id, video_resume_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertJob.run(
    company.id,
    title,
    description || '',
    salaryMin,
    salaryMax,
    location || '',
    skills ? JSON.stringify(skills) : null,
    experienceRequired || '',
    educationRequired || '',
    videoId || null,
    videoResumeEnabled !== false ? 1 : 0
  );

  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
  job.skills = job.skills ? JSON.parse(job.skills) : [];

  res.json({ job });
}

function updateJob(req, res) {
  const jobId = req.params.id;
  const { title, description, salaryMin, salaryMax, location, skills, experienceRequired, educationRequired, videoId, videoResumeEnabled, isActive } = req.body;

  const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id);
  if (!company) {
    return res.status(404).json({ error: '企业信息不存在' });
  }

  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND company_id = ?').get(jobId, company.id);
  if (!job) {
    return res.status(404).json({ error: '岗位不存在或无权限修改' });
  }

  const updateJob = db.prepare(`
    UPDATE jobs SET 
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      salary_min = COALESCE(?, salary_min),
      salary_max = COALESCE(?, salary_max),
      location = COALESCE(?, location),
      skills = COALESCE(?, skills),
      experience_required = COALESCE(?, experience_required),
      education_required = COALESCE(?, education_required),
      video_id = COALESCE(?, video_id),
      video_resume_enabled = COALESCE(?, video_resume_enabled),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `);

  updateJob.run(
    title,
    description,
    salaryMin,
    salaryMax,
    location,
    skills ? JSON.stringify(skills) : null,
    experienceRequired,
    educationRequired,
    videoId,
    videoResumeEnabled,
    isActive,
    jobId
  );

  const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  updatedJob.skills = updatedJob.skills ? JSON.parse(updatedJob.skills) : [];

  res.json({ job: updatedJob });
}

function getCompanyJobs(req, res) {
  const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id);
  if (!company) {
    return res.status(404).json({ error: '企业信息不存在' });
  }

  const jobs = db.prepare(`
    SELECT j.*, v.status as video_status, v.file_path as video_path
    FROM jobs j
    LEFT JOIN videos v ON j.video_id = v.id
    WHERE j.company_id = ?
    ORDER BY j.created_at DESC
  `).all(company.id);

  jobs.forEach(job => {
    job.skills = job.skills ? JSON.parse(job.skills) : [];
  });

  res.json({ jobs });
}

function getJobs(req, res) {
  const { page = 1, limit = 20, keyword, minSalary, maxSalary, location } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT j.*, c.name as company_name, c.logo as company_logo, c.credit_score as company_credit, c.verified as company_verified, c.industry as company_industry,
           v.status as video_status, v.file_path as video_path, v.thumbnail as video_thumbnail, v.video_type as video_type, v.title as video_title
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    LEFT JOIN videos v ON j.video_id = v.id
    WHERE j.is_active = 1 AND (v.status = 'approved' OR v.status IS NULL)
  `;
  let params = [];

  if (keyword) {
    sql += ' AND (j.title LIKE ? OR j.description LIKE ? OR c.name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  if (minSalary) {
    sql += ' AND j.salary_max >= ?';
    params.push(minSalary);
  }

  if (maxSalary) {
    sql += ' AND j.salary_min <= ?';
    params.push(maxSalary);
  }

  if (location) {
    sql += ' AND j.location LIKE ?';
    params.push(`%${location}%`);
  }

  sql += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const jobs = db.prepare(sql).all(...params);

  jobs.forEach(job => {
    job.skills = job.skills ? JSON.parse(job.skills) : [];
  });

  const countSql = `
    SELECT COUNT(*) as total
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    LEFT JOIN videos v ON j.video_id = v.id
    WHERE j.is_active = 1 AND (v.status = 'approved' OR v.status IS NULL)
  `;

  const { total } = db.prepare(countSql).get();

  res.json({ jobs, total, page: parseInt(page), limit: parseInt(limit) });
}

function getJobDetail(req, res) {
  const jobId = req.params.id;

  const job = db.prepare(`
    SELECT j.*, c.name as company_name, c.logo as company_logo, c.industry as company_industry,
           c.size as company_size, c.description as company_description, c.location as company_location,
           c.credit_score as company_credit, c.verified as company_verified,
           v.status as video_status, v.file_path as video_path, v.thumbnail as video_thumbnail, v.video_type as video_type, v.title as video_title
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    LEFT JOIN videos v ON j.video_id = v.id
    WHERE j.id = ?
  `).get(jobId);

  if (!job) {
    return res.status(404).json({ error: '岗位不存在' });
  }

  job.skills = job.skills ? JSON.parse(job.skills) : [];

  db.prepare('UPDATE jobs SET views_count = views_count + 1 WHERE id = ?').run(jobId);

  db.prepare('INSERT INTO view_logs (job_id, action) VALUES (?, ?)').run(jobId, 'view');

  res.json({ job });
}

module.exports = { createJob, updateJob, getCompanyJobs, getJobs, getJobDetail };
