const express = require('express');
const db = require('../db');
const { success, error, paginate } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function detectFraud(job) {
  let score = 0;
  const factors = [];
  
  if (job.salary_min > 0 && job.salary_max > 0) {
    const ratio = job.salary_max / job.salary_min;
    if (ratio > 3) {
      score += 25;
      factors.push('薪资范围异常，最高薪资是最低薪资的3倍以上');
    }
  }
  
  if (job.title && job.title.length > 50) {
    score += 10;
    factors.push('职位名称过长，可能包含关键词堆砌');
  }
  
  if (job.jd_content && job.jd_content.length < 50) {
    score += 30;
    factors.push('职位描述过短，信息不完整');
  }
  
  const keywords = ['高薪', '日结', '兼职', '刷单', '在家办公', '无需经验'];
  keywords.forEach(kw => {
    if ((job.title + job.jd_content).includes(kw)) {
      score += 15;
      factors.push(`包含高风险关键词：${kw}`);
    }
  });
  
  if (!job.work_address || job.work_address.length < 5) {
    score += 20;
    factors.push('工作地址不详细');
  }
  
  let riskLevel = 'low';
  if (score >= 50) riskLevel = 'medium';
  if (score >= 75) riskLevel = 'high';
  
  return { score, riskLevel, factors };
}

router.get('/', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, status, keyword, job_type, work_city } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereCount = 'WHERE company_id = ?';
  let whereList = 'WHERE j.company_id = ?';
  const params = [req.companyId];
  
  if (status && status !== 'all') {
    whereCount += ' AND status = ?';
    whereList += ' AND j.status = ?';
    params.push(status);
  }
  if (keyword) {
    whereCount += ' AND (title LIKE ? OR jd_content LIKE ? OR department LIKE ?)';
    whereList += ' AND (j.title LIKE ? OR j.jd_content LIKE ? OR j.department LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  if (job_type) {
    whereCount += ' AND job_type = ?';
    whereList += ' AND j.job_type = ?';
    params.push(job_type);
  }
  if (work_city) {
    whereCount += ' AND work_city = ?';
    whereList += ' AND j.work_city = ?';
    params.push(work_city);
  }
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM jobs ${whereCount}`).get(...params).count;
  
  const list = db.prepare(`
    SELECT j.*, hu.name as hr_name, hu.avatar as hr_avatar
    FROM jobs j
    LEFT JOIN hr_users hu ON j.hr_id = hu.id
    ${whereList}
    ORDER BY j.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  res.json(paginate(list, total, parseInt(page), parseInt(pageSize)));
});

router.get('/templates', authMiddleware, (req, res) => {
  const { category } = req.query;
  
  let where = 'WHERE is_system = 1';
  const params = [];
  
  if (category) {
    where += ' AND category = ?';
    params.push(category);
  }
  
  const systemTemplates = db.prepare(`SELECT * FROM jd_templates ${where} ORDER BY id ASC`).all(...params);
  
  const companyTemplates = db.prepare(`
    SELECT * FROM jd_templates 
    WHERE company_id = ? 
    ORDER BY created_at DESC
  `).all(req.companyId);
  
  res.json(success({
    systemTemplates,
    companyTemplates
  }));
});

router.post('/templates', authMiddleware, (req, res) => {
  const { name, category, content } = req.body;
  
  const info = db.prepare(`
    INSERT INTO jd_templates (company_id, name, category, content, is_system)
    VALUES (?, ?, ?, ?, 0)
  `).run(req.companyId, name, category, content);
  
  res.json(success({ id: info.lastInsertRowid }, '模板创建成功'));
});

router.get('/tags', authMiddleware, (req, res) => {
  const { category } = req.query;
  
  let where = '';
  const params = [];
  
  if (category) {
    where = 'WHERE category = ?';
    params.push(category);
  }
  
  const tags = db.prepare(`SELECT * FROM competency_tags ${where} ORDER BY name ASC`).all(...params);
  
  res.json(success(tags));
});

router.get('/:id', authMiddleware, (req, res) => {
  const job = db.prepare(`
    SELECT j.*, hu.name as hr_name, hu.avatar as hr_avatar,
      (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count,
      (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id AND status = 'interview') as interview_count
    FROM jobs j
    LEFT JOIN hr_users hu ON j.hr_id = hu.id
    WHERE j.id = ? AND j.company_id = ?
  `).get(req.params.id, req.companyId);
  
  if (!job) {
    return res.json(error('职位不存在'));
  }
  
  const applications = db.prepare(`
    SELECT ja.*, c.name as candidate_name, c.phone, c.email, c.avatar,
      c.expected_position, c.work_years, c.highest_education, c.skill_tags, c.resume_score
    FROM job_applications ja
    LEFT JOIN candidates c ON ja.candidate_id = c.id
    WHERE ja.job_id = ?
    ORDER BY ja.match_score DESC
    LIMIT 20
  `).all(req.params.id);
  
  res.json(success({
    job,
    applications
  }));
});

router.post('/', authMiddleware, (req, res) => {
  const { title, department, job_type, work_city, work_district, work_address, longitude, latitude, salary_min, salary_max, salary_negotiable, education, experience, jd_content, jd_template_id, competency_tags, benefits, channel } = req.body;
  
  if (!title || !work_city || !salary_min || !salary_max || !jd_content) {
    return res.json(error('请填写完整信息'));
  }
  
  const jobData = { title, department, job_type, work_city, work_district, work_address, longitude, latitude, salary_min, salary_max, salary_negotiable: salary_negotiable ? 1 : 0, education, experience, jd_content, jd_template_id, competency_tags: Array.isArray(competency_tags) ? competency_tags.join(',') : competency_tags, benefits: Array.isArray(benefits) ? benefits.join(',') : benefits, channel, hr_id: req.userId, company_id: req.companyId };
  
  const fraud = detectFraud(jobData);
  
  jobData.fraud_score = fraud.score;
  jobData.fraud_status = fraud.score >= 75 ? 'rejected' : (fraud.score >= 50 ? 'warning' : 'normal');
  jobData.fraud_reason = fraud.factors.join('; ');
  
  const info = db.prepare(`
    INSERT INTO jobs (company_id, hr_id, title, department, job_type, work_city, work_district, work_address, longitude, latitude, salary_min, salary_max, salary_negotiable, education, experience, jd_content, jd_template_id, competency_tags, benefits, channel, status, fraud_score, fraud_status, fraud_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)
  `).run(req.companyId, req.userId, title, department, job_type, work_city, work_district, work_address, longitude, latitude, salary_min, salary_max, salary_negotiable, education, experience, jd_content, jd_template_id, jobData.competency_tags, jobData.benefits, channel, fraud.score, jobData.fraud_status, jobData.fraud_reason);
  
  db.prepare(`
    INSERT INTO fraud_detections (job_id, company_id, risk_score, risk_level, risk_factors)
    VALUES (?, ?, ?, ?, ?)
  `).run(info.lastInsertRowid, req.companyId, fraud.score, fraud.riskLevel, JSON.stringify(fraud.factors));
  
  res.json(success({ id: info.lastInsertRowid, fraud }, '职位创建成功'));
});

router.put('/:id', authMiddleware, (req, res) => {
  const { title, department, job_type, work_city, work_district, work_address, longitude, latitude, salary_min, salary_max, salary_negotiable, education, experience, jd_content, jd_template_id, competency_tags, benefits, channel, status } = req.body;
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND company_id = ?').get(req.params.id, req.companyId);
  if (!job) {
    return res.json(error('职位不存在'));
  }
  
  const tagsStr = Array.isArray(competency_tags) ? competency_tags.join(',') : competency_tags;
  const benefitsStr = Array.isArray(benefits) ? benefits.join(',') : benefits;
  
  db.prepare(`
    UPDATE jobs SET
      title = ?, department = ?, job_type = ?, work_city = ?, work_district = ?,
      work_address = ?, longitude = ?, latitude = ?, salary_min = ?, salary_max = ?,
      salary_negotiable = ?, education = ?, experience = ?, jd_content = ?, jd_template_id = ?,
      competency_tags = ?, benefits = ?, channel = ?, status = ?, updated_at = datetime('now')
    WHERE id = ? AND company_id = ?
  `).run(title, department, job_type, work_city, work_district, work_address, longitude, latitude, salary_min, salary_max, salary_negotiable ? 1 : 0, education, experience, jd_content, jd_template_id, tagsStr, benefitsStr, channel, status || job.status, req.params.id, req.companyId);
  
  res.json(success(null, '更新成功'));
});

router.post('/:id/publish', authMiddleware, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND company_id = ?').get(req.params.id, req.companyId);
  if (!job) {
    return res.json(error('职位不存在'));
  }
  
  if (job.fraud_status === 'rejected') {
    return res.json(error('职位存在风险，无法发布，请先修改'));
  }
  
  db.prepare(`
    UPDATE jobs SET status = 'published', publish_time = datetime('now'), updated_at = datetime('now')
    WHERE id = ? AND company_id = ?
  `).run(req.params.id, req.companyId);
  
  res.json(success(null, '发布成功'));
});

router.post('/:id/offline', authMiddleware, (req, res) => {
  db.prepare(`
    UPDATE jobs SET status = 'offline', updated_at = datetime('now')
    WHERE id = ? AND company_id = ?
  `).run(req.params.id, req.companyId);
  
  res.json(success(null, '已下架'));
});

router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare(`DELETE FROM jobs WHERE id = ? AND company_id = ?`).run(req.params.id, req.companyId);
  res.json(success(null, '删除成功'));
});

router.get('/hot/areas', authMiddleware, (req, res) => {
  const { city, date } = req.query;
  const recordDate = date || new Date().toISOString().split('T')[0];
  
  let where = 'WHERE record_date = ?';
  const params = [recordDate];
  
  if (city) {
    where += ' AND city = ?';
    params.push(city);
  }
  
  const areas = db.prepare(`
    SELECT * FROM hot_area_records ${where} ORDER BY hot_score DESC LIMIT 50
  `).all(...params);
  
  res.json(success(areas));
});

module.exports = router;
