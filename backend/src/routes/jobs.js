const express = require('express');
const db = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');
const { updateJobSalaryCompliance, checkSalaryCompliance } = require('../services/salaryService');

const router = express.Router();

router.get('/', (req, res) => {
  const { category, city, keyword, page = 1, pageSize = 10 } = req.query;
  const limit = parseInt(pageSize, 10) || 10;
  const currentPage = parseInt(page, 10) || 1;
  const offset = (currentPage - 1) * limit;

  const where = [`j.status = 'active'`];
  const params = [];

  if (category) {
    where.push('j.job_category_code LIKE ?');
    params.push(category + '%');
  }
  if (city) {
    where.push('j.city = ?');
    params.push(city);
  }
  if (keyword) {
    where.push('(j.job_title LIKE ? OR j.job_description LIKE ? OR c.category_name LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const fromSql = `
    FROM jobs j
    JOIN enterprises e ON j.enterprise_id = e.id
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    WHERE ${where.join(' AND ')}
  `;

  const jobsSql = `
    SELECT j.*, e.enterprise_name, e.qualification_status, c.category_name, c.category_code
    ${fromSql}
    ORDER BY j.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const jobs = db.prepare(jobsSql).all(...params, limit, offset);
  const countRow = db.prepare(`SELECT COUNT(*) as total ${fromSql}`).get(...params);

  res.json({
    jobs: jobs.map(j => ({
      ...j,
      ability_model: j.ability_model ? JSON.parse(j.ability_model) : null,
    })),
    total: countRow?.total || 0,
    page: currentPage,
    pageSize: limit,
  });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM manufacturing_job_categories ORDER BY category_code').all();
  const tree = [];
  const map = {};

  categories.forEach(c => {
    map[c.category_code] = { ...c, children: [] };
  });

  categories.forEach(c => {
    if (c.parent_code && map[c.parent_code]) {
      map[c.parent_code].children.push(map[c.category_code]);
    } else if (!c.parent_code) {
      tree.push(map[c.category_code]);
    }
  });

  res.json({ categories, tree });
});

router.get('/:id', (req, res) => {
  const job = db.prepare(`
    SELECT j.*, e.enterprise_name, e.industry, e.scale, e.address,
           c.category_code, c.category_name, c.parent_code,
           pc.category_name as parent_category_name,
           sr.salary_min as ref_salary_min, sr.salary_max as ref_salary_max,
           sr.work_years as ref_work_years
    FROM jobs j
    JOIN enterprises e ON j.enterprise_id = e.id
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    LEFT JOIN manufacturing_job_categories pc ON c.parent_code = pc.category_code
    LEFT JOIN salary_references sr ON j.job_category_code = sr.job_category_code 
      AND j.city = sr.city AND j.work_experience_required = sr.work_years
    WHERE j.id = ?
    ORDER BY sr.effective_date DESC
  `).get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: '岗位不存在' });
  }

  job.ability_model = job.ability_model ? JSON.parse(job.ability_model) : null;

  const compliance = {
    checked: job.salary_compliance_checked === 1,
    remark: job.salary_compliance_remark,
    reference: job.ref_salary_min ? {
      min: job.ref_salary_min,
      max: job.ref_salary_max,
      work_years: job.ref_work_years,
    } : null,
  };

  if (compliance.checked && job.ref_salary_min) {
    const minLowerBound = job.ref_salary_min * 0.8;
    const maxUpperBound = job.ref_salary_max * 1.5;
    compliance.compliant = job.salary_min >= minLowerBound && job.salary_max <= maxUpperBound;
    compliance.issues = [];
    if (job.salary_min < minLowerBound) {
      compliance.issues.push(`最低薪资低于参考下限 ${Math.round(minLowerBound)} 元`);
    }
    if (job.salary_max > maxUpperBound) {
      compliance.issues.push(`最高薪资高于参考上限 ${Math.round(maxUpperBound)} 元`);
    }
  }

  delete job.ref_salary_min;
  delete job.ref_salary_max;
  delete job.ref_work_years;
  delete job.salary_compliance_checked;
  delete job.salary_compliance_remark;

  res.json({ job, salaryCompliance: compliance });
});

router.post('/', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);
  if (!enterprise) {
    return res.status(400).json({ error: '企业信息不存在' });
  }

  const {
    job_category_code, job_title, job_description, requirements,
    ability_model, salary_min, salary_max, city,
    work_experience_required, education_required
  } = req.body;

  const compliance = checkSalaryCompliance(
    job_category_code, city, salary_min, salary_max, work_experience_required
  );

  const info = db.prepare(`
    INSERT INTO jobs (
      enterprise_id, job_category_code, job_title, job_description, requirements,
      ability_model, salary_min, salary_max, city, work_experience_required,
      education_required, salary_compliance_checked, salary_compliance_remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    enterprise.id, job_category_code, job_title, job_description, requirements,
    JSON.stringify(ability_model || {}), salary_min, salary_max, city,
    work_experience_required, education_required, compliance.remark
  );

  logAction('create_job', req, 'job', info.lastInsertRowid, `发布岗位：${job_title}`);

  res.json({
    jobId: info.lastInsertRowid,
    salaryCompliance: compliance,
  });
});

router.put('/:id', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: '岗位不存在' });
  }

  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);
  if (req.user.role !== 'admin' && (!enterprise || enterprise.id !== job.enterprise_id)) {
    return res.status(403).json({ error: '无权限修改此岗位' });
  }

  const {
    job_title, job_description, requirements, ability_model,
    salary_min, salary_max, city, work_experience_required,
    education_required, status
  } = req.body;

  const compliance = checkSalaryCompliance(
    job.job_category_code, city || job.city,
    salary_min || job.salary_min, salary_max || job.salary_max,
    work_experience_required || job.work_experience_required
  );

  db.prepare(`
    UPDATE jobs SET
      job_title = COALESCE(?, job_title),
      job_description = COALESCE(?, job_description),
      requirements = COALESCE(?, requirements),
      ability_model = COALESCE(?, ability_model),
      salary_min = COALESCE(?, salary_min),
      salary_max = COALESCE(?, salary_max),
      city = COALESCE(?, city),
      work_experience_required = COALESCE(?, work_experience_required),
      education_required = COALESCE(?, education_required),
      status = COALESCE(?, status),
      salary_compliance_checked = 1,
      salary_compliance_remark = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    job_title, job_description, requirements,
    ability_model ? JSON.stringify(ability_model) : null,
    salary_min, salary_max, city, work_experience_required,
    education_required, status, compliance.remark, req.params.id
  );

  logAction('update_job', req, 'job', req.params.id, `更新岗位信息：${job_title || job.job_title}`);

  res.json({ success: true, salaryCompliance: compliance });
});

router.post('/:id/check-salary', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const result = updateJobSalaryCompliance(req.params.id);
  if (!result) {
    return res.status(404).json({ error: '岗位不存在' });
  }
  res.json(result);
});

module.exports = router;
