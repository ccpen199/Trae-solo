const express = require('express');
const { db } = require('../models/db');
const { authMiddleware } = require('./auth');

const router = express.Router();

function detectSuspiciousJob(title, salaryMin, salaryMax, requirements, industry) {
  const avgSalaries = {
    '餐饮': { min: 4000, max: 7000 },
    '零售': { min: 4000, max: 6500 },
    '物流': { min: 5000, max: 9000 }
  };

  const avg = avgSalaries[industry] || { min: 4000, max: 7000 };
  const highSalaryThreshold = avg.max * 1.5;
  const lowRequirementKeywords = ['无经验', '无需经验', '学历不限', '无需学历', '可培训'];
  const isLowRequirement = lowRequirementKeywords.some(k => requirements && requirements.includes(k));
  const isHighSalary = salaryMax > highSalaryThreshold;

  if (isHighSalary && isLowRequirement) {
    return {
      isSuspicious: 1,
      reason: `高薪低门槛预警：该职位最高薪资${salaryMax}元超过行业平均${avg.max}元的50%，且要求门槛过低，存在虚假招聘风险`
    };
  }
  return { isSuspicious: 0, reason: null };
}

router.get('/', (req, res) => {
  const { keyword, industry, arrival_time, min_salary, max_salary, page = 1, pageSize = 10 } = req.query;

  let sql = `
    SELECT j.*, c.name as company_name, c.turnover_rate, c.social_insurance_rate, c.credit_score
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.status = 'active'
  `;
  const params = [];

  if (keyword) {
    sql += ' AND (j.title LIKE ? OR j.requirements LIKE ? OR c.name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (industry) {
    sql += ' AND j.industry = ?';
    params.push(industry);
  }
  if (arrival_time) {
    sql += ' AND j.arrival_time = ?';
    params.push(arrival_time);
  }
  if (min_salary) {
    sql += ' AND j.salary_max >= ?';
    params.push(parseInt(min_salary));
  }
  if (max_salary) {
    sql += ' AND j.salary_min <= ?';
    params.push(parseInt(max_salary));
  }

  const countSql = sql.replace('SELECT j.*, c.name as company_name, c.turnover_rate, c.social_insurance_rate, c.credit_score', 'SELECT COUNT(*) as count');
  const total = db.prepare(countSql).get(...params).count;

  sql += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const jobs = db.prepare(sql).all(...params);
  res.json({ jobs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/company/my', authMiddleware, (req, res) => {
  if (req.user.role !== 'company') {
    return res.status(403).json({ error: '无权限' });
  }

  const jobs = db.prepare(`
    SELECT j.*, 
           (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as application_count
    FROM jobs j
    WHERE j.company_id = ?
    ORDER BY j.created_at DESC
  `).all(req.user.company_id);

  res.json(jobs);
});

router.get('/:id', (req, res) => {
  const job = db.prepare(`
    SELECT j.*, c.name as company_name, c.industry as company_industry, c.contact_person, c.contact_phone,
           c.turnover_rate, c.social_insurance_rate, c.credit_score, c.address as company_address
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.id = ?
  `).get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  const reviews = db.prepare(`
    SELECT r.*, js.name as seeker_name
    FROM reviews r
    LEFT JOIN job_seekers js ON r.seeker_id = js.id
    WHERE r.company_id = ?
    ORDER BY r.created_at DESC
    LIMIT 10
  `).all(job.company_id);

  res.json({ ...job, reviews });
});

router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'company') {
    return res.status(403).json({ error: '只有企业用户可以发布职位' });
  }

  const { title, industry, salary_min, salary_max, work_address, arrival_time, requirements, benefits } = req.body;

  if (!title || !industry || !salary_min || !salary_max || !work_address || !arrival_time) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }

  const addressPattern = /.*[路街道号层室].*/;
  if (!addressPattern.test(work_address) || work_address.length < 10) {
    return res.status(400).json({ error: '实际工作地址必须精确到门牌号，如"北京市朝阳区XX路XX号XX大厦X层"' });
  }

  if (!['当日', '3日内', '一周内'].includes(arrival_time)) {
    return res.status(400).json({ error: '到岗时效必须选择：当日/3日内/一周内' });
  }

  const { isSuspicious, reason } = detectSuspiciousJob(title, salary_min, salary_max, requirements, industry);

  try {
    const result = db.prepare(`
      INSERT INTO jobs (company_id, title, industry, salary_min, salary_max, work_address, arrival_time, requirements, benefits, is_suspicious, suspicious_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.company_id, title, industry, salary_min, salary_max, work_address, arrival_time, requirements, benefits, isSuspicious, reason);

    res.json({ id: result.lastInsertRowid, is_suspicious: isSuspicious, suspicious_reason: reason });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
