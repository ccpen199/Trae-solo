const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware');

const router = express.Router();

function parseJSONField(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch (e) {
    return value;
  }
}

function formatJob(job) {
  if (!job) return null;
  return {
    ...job,
    tags: parseJSONField(job.tags),
    rcep_skills: parseJSONField(job.rcep_skills),
    has_ftz_subsidy: !!job.has_ftz_subsidy,
    is_approved: !!job.is_approved,
    is_active: !!job.is_active,
    is_encouraged_industry: !!job.is_encouraged_industry
  };
}

router.get('/', (req, res) => {
  const { 
    category, keyword, has_ftz_subsidy, salary_min, salary_max, rcep_skill, page = 1, limit = 10 } = req.query;
  
  let sql = `
    SELECT j.*, c.company_name, c.is_encouraged_industry, ic.name_cn as category_name, ic.name_en as category_name_en
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    LEFT JOIN industry_catalog ic ON j.category = ic.code
    WHERE j.is_active = 1 AND j.is_approved = 1
  `;
  const params = [];

  if (category) {
    sql += ' AND j.category = ?';
    params.push(category);
  }

  if (keyword) {
    sql += ` AND (
      j.title_cn LIKE ? OR j.title_en LIKE ? OR j.description_cn LIKE ? OR j.description_en LIKE ?
      OR j.requirements_cn LIKE ? OR j.requirements_en LIKE ? OR j.tags LIKE ? OR j.rcep_skills LIKE ?
    )`;
    params.push(
      `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`,
      `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`
    );
  }

  if (has_ftz_subsidy === '1') {
    sql += ' AND j.has_ftz_subsidy = 1';
  }

  if (salary_min) {
    sql += ' AND j.salary_max >= ?';
    params.push(parseInt(salary_min));
  }

  if (salary_max) {
    sql += ' AND j.salary_min <= ?';
    params.push(parseInt(salary_max));
  }

  if (rcep_skill) {
    sql += ' AND (j.rcep_skills LIKE ? OR j.tags LIKE ? OR j.requirements_cn LIKE ? OR j.requirements_en LIKE ?)';
    params.push(`%"${rcep_skill}"%`, `%${rcep_skill}%`, `%${rcep_skill}%`, `%${rcep_skill}%`);
  }

  const countSql = `SELECT COUNT(*) as count FROM (${sql}) as filtered_jobs`;
  const total = db.prepare(countSql).get(...params).count;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  sql += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const jobs = db.prepare(sql).all(...params);

  res.json({
    jobs: jobs.map(formatJob),
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

router.get('/company/my', authenticateToken, requireRole(['company']), (req, res) => {
  const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id);
  if (!company) {
    return res.status(404).json({ error: '未找到企业信息' });
  }

  const jobs = db.prepare(`
    SELECT j.*, ic.name_cn as category_name
    FROM jobs j
    LEFT JOIN industry_catalog ic ON j.category = ic.code
    WHERE j.company_id = ?
    ORDER BY j.created_at DESC
  `).all(company.id);

  res.json(jobs.map(formatJob));
});

router.get('/:id', (req, res) => {
  const job = db.prepare(`
    SELECT j.*, c.company_name, c.description as company_description, c.is_encouraged_industry, 
           ic.name_cn as category_name, ic.name_en as category_name_en
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    LEFT JOIN industry_catalog ic ON j.category = ic.code
    WHERE j.id = ?
  `).get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  const formatted = formatJob(job);
  
  const recording = db.prepare('SELECT * FROM job_recordings WHERE job_id = ?').get(req.params.id);
  formatted.recording = recording || null;

  if (recording) {
    formatted.recording = {
      ...recording,
    };
  }

  const policies = [];
  if (job.subsidy_policy_ref) {
    const policyRefs = job.subsidy_policy_ref.split(',');
    for (const ref of policyRefs) {
      const policy = db.prepare('SELECT * FROM policies WHERE policy_number = ? AND is_active = 1').get(ref.trim());
      if (policy) policies.push(policy);
    }
  }
  formatted.applicable_policies = policies;

  res.json(formatted);
});

router.post('/', authenticateToken, requireRole(['company', 'admin']), (req, res) => {
  const {
    title_cn, title_en, description_cn, description_en,
    requirements_cn, requirements_en, category,
    salary_min, salary_max, location, employment_type,
    tags, rcep_skills, has_ftz_subsidy, subsidy_policy_ref, policy_basis
  } = req.body;

  if (!title_cn || !description_cn || !category) {
    return res.status(400).json({ error: '请填写必填字段' });
  }

  let companyId = null;
  if (req.user.role === 'company') {
    const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id);
    if (!company) {
      return res.status(400).json({ error: '企业用户未找到企业信息' });
    }
    companyId = company.id;
  } else if (req.user.role === 'admin') {
    companyId = req.body.company_id;
    if (!companyId) {
      return res.status(400).json({ error: '请指定企业ID' });
    }
  }

  const company = db.prepare('SELECT is_encouraged_industry FROM companies WHERE id = ?').get(companyId);
  
  let finalHasFtzSubsidy = has_ftz_subsidy ? 1 : 0;
  let autoMatchPolicies = [];
  
  if (company && company.is_encouraged_industry) {
    finalHasFtzSubsidy = 1;
    autoMatchPolicies.push('财税〔2020〕31号');
  }

  let finalPolicyRef = subsidy_policy_ref;
  let finalPolicyBasis = policy_basis;
  
  if (finalHasFtzSubsidy && !finalPolicyRef) {
    const matchedPolicies = matchPoliciesForJob(category, salary_max, employment_type);
    if (matchedPolicies.length > 0) {
      finalPolicyRef = matchedPolicies.join(',');
      finalPolicyBasis = generatePolicyBasis(matchedPolicies);
    }
  }

  const result = db.prepare(`
    INSERT INTO jobs (company_id, title_cn, title_en, description_cn, description_en,
      requirements_cn, requirements_en, category, salary_min, salary_max, location, employment_type,
      tags, rcep_skills, has_ftz_subsidy, subsidy_policy_ref, policy_basis, is_approved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    companyId,
    title_cn, title_en || null,
    description_cn, description_en || null,
    requirements_cn || null, requirements_en || null,
    category,
    salary_min || null, salary_max || null,
    location || null, employment_type || null,
    tags ? JSON.stringify(tags || []) : null,
    rcep_skills ? JSON.stringify(rcep_skills || []) : null,
    finalHasFtzSubsidy,
    finalPolicyRef || null,
    finalPolicyBasis || null,
    req.user.role === 'admin' ? 1 : 0
  );

  const jobId = result.lastInsertRowid;

  db.prepare('INSERT INTO job_recordings (job_id, recording_status) VALUES (?, ?)').run(jobId, 'pending');

  res.status(201).json({ id: jobId, message: req.user.role === 'admin' ? '职位已发布' : '职位已提交，等待审核' });
});

function matchPoliciesForJob(category, salaryMax, employmentType) {
  const policies = [];
  
  if (salaryMax && salaryMax >= 20000) {
    policies.push('财税〔2020〕32号');
  }
  
  policies.push('琼办发〔2019〕41号');
  
  return policies;
}

function generatePolicyBasis(policyRefs) {
  const basis = [];
  for (const ref of policyRefs) {
    const policy = db.prepare('SELECT title_cn, content_cn FROM policies WHERE policy_number = ?').get(ref);
    if (policy) {
      basis.push(`${policy.title_cn}：${policy.content_cn.substring(0, 50)}...`);
    }
  }
  return basis.join('\n');
}

router.put('/:id', authenticateToken, requireRole(['company', 'admin']), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  if (req.user.role === 'company') {
    const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id);
    if (!company || company.id !== job.company_id) {
      return res.status(403).json({ error: '无权修改此职位' });
    }
  }

  const {
    title_cn, title_en, description_cn, description_en,
    requirements_cn, requirements_en, category,
    salary_min, salary_max, location, employment_type,
    tags, rcep_skills, has_ftz_subsidy, subsidy_policy_ref, policy_basis, is_active
  } = req.body;

  db.prepare(`
    UPDATE jobs SET 
      title_cn = COALESCE(?, title_cn),
      title_en = COALESCE(?, title_en),
      description_cn = COALESCE(?, description_cn),
      description_en = COALESCE(?, description_en),
      requirements_cn = COALESCE(?, requirements_cn),
      requirements_en = COALESCE(?, requirements_en),
      category = COALESCE(?, category),
      salary_min = COALESCE(?, salary_min),
      salary_max = COALESCE(?, salary_max),
      location = COALESCE(?, location),
      employment_type = COALESCE(?, employment_type),
      tags = COALESCE(?, tags),
      rcep_skills = COALESCE(?, rcep_skills),
      has_ftz_subsidy = COALESCE(?, has_ftz_subsidy),
      subsidy_policy_ref = COALESCE(?, subsidy_policy_ref),
      policy_basis = COALESCE(?, policy_basis),
      is_active = COALESCE(?, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title_cn, title_en, description_cn, description_en,
    requirements_cn, requirements_en, category,
    salary_min, salary_max, location, employment_type,
    tags ? JSON.stringify(tags || []) : null,
    rcep_skills ? JSON.stringify(rcep_skills || []) : null,
    has_ftz_subsidy ? 1 : 0,
    subsidy_policy_ref, policy_basis,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    req.params.id
  );

  res.json({ message: '职位已更新' });
});

router.post('/:id/apply', authenticateToken, requireRole(['jobseeker']), (req, res) => {
  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user.id);
  if (!jobseeker) {
    return res.status(400).json({ error: '未找到求职者信息' });
  }

  const existing = db.prepare('SELECT id FROM applications WHERE job_id = ? AND jobseeker_id = ?').get(req.params.id, jobseeker.id);
  if (existing) {
    return res.status(400).json({ error: '您已申请过此职位' });
  }

  const { cover_letter } = req.body;

  db.prepare('INSERT INTO applications (job_id, jobseeker_id, cover_letter) VALUES (?, ?, ?)').run(
    req.params.id, jobseeker.id, cover_letter || null
  );

  res.status(201).json({ message: '申请已提交' });
});

router.get('/:id/applications', authenticateToken, requireRole(['company', 'admin']), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  if (req.user.role === 'company') {
    const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id);
    if (!company || company.id !== job.company_id) {
      return res.status(403).json({ error: '无权查看此职位的申请' });
    }
  }

  const applications = db.prepare(`
    SELECT a.*, u.name as jobseeker_name, u.email, u.phone,
           jk.skills, jk.experience_years, jk.education
    FROM applications a
    LEFT JOIN jobseekers jk ON a.jobseeker_id = jk.id
    LEFT JOIN users u ON jk.user_id = u.id
    WHERE a.job_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.id);

  res.json(applications.map(app => ({
    ...app,
    skills: parseJSONField(app.skills)
  })));
});

module.exports = router;
