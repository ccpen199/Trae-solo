const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateUser } = require('../middleware/auth');
const { crossValidate } = require('../utils/validators');
const crypto = require('crypto');

router.get('/', (req, res) => {
  const { region_code, type, employer_type, salary_type, keyword, page = 1, page_size = 20 } = req.query;
  let sql = `SELECT j.*, r.name as region_name FROM jobs j
    LEFT JOIN admin_regions r ON j.region_code = r.code
    WHERE j.status = 1`;
  const params = [];
  if (region_code) {
    sql += ' AND j.region_code = ?';
    params.push(region_code);
  }
  if (type) {
    sql += ' AND j.type = ?';
    params.push(type);
  }
  if (employer_type) {
    sql += ' AND j.employer_type = ?';
    params.push(employer_type);
  }
  if (salary_type) {
    sql += ' AND j.salary_type = ?';
    params.push(salary_type);
  }
  if (keyword) {
    sql += ' AND (j.title LIKE ? OR j.description LIKE ? OR j.requirements LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  sql += ' ORDER BY j.verified DESC, j.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
  const jobs = db.prepare(sql).all(...params);
  const countSql = 'SELECT COUNT(*) as total FROM jobs WHERE status = 1';
  const total = db.prepare(countSql).get().total;
  res.json({ jobs, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/templates', (req, res) => {
  const templates = db.prepare('SELECT * FROM job_hourly_templates WHERE is_public = 1 ORDER BY id').all();
  res.json({ templates });
});

router.get('/:id', (req, res) => {
  const job = db.prepare(`SELECT j.*, r.name as region_name FROM jobs j
    LEFT JOIN admin_regions r ON j.region_code = r.code
    WHERE j.id = ?`).get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: '招聘信息不存在' });
  }
  const applications = db.prepare(`SELECT ja.*, u.username, u.real_name FROM job_applications ja
    LEFT JOIN users u ON ja.applicant_id = u.id
    WHERE ja.job_id = ?`).all(req.params.id);
  const signatures = db.prepare('SELECT * FROM e_signatures WHERE job_id = ?').all(req.params.id);
  res.json({ job, applications, signatures });
});

router.post('/', authenticateUser, (req, res) => {
  const { title, type, employer_type, employer_name, region_code, address, salary_type, salary_min, salary_max, hourly_rate, description, requirements, contact_name, contact_phone } = req.body;
  if (!title || !type || !employer_type || !employer_name || !region_code || !salary_type || !contact_name || !contact_phone) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  if (salary_type === 'monthly' && (!salary_min || !salary_max)) {
    return res.status(400).json({ error: '月薪需要填写薪资范围' });
  }
  if (salary_type === 'hourly' && !hourly_rate) {
    return res.status(400).json({ error: '小时工需要填写小时薪资' });
  }
  const result = db.prepare(`
    INSERT INTO jobs (title, type, employer_type, employer_name, region_code, address, salary_type, salary_min, salary_max, hourly_rate, description, requirements, contact_name, contact_phone, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, type, employer_type, employer_name, region_code, address, salary_type, salary_min, salary_max, hourly_rate, description, requirements, contact_name, contact_phone, req.user.id);
  const validation = crossValidate('job', result.lastInsertRowid, { salary_type, salary_min, salary_max, hourly_rate, title, description });
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
  res.json({ message: '发布成功', job, validation });
});

router.post('/:id/apply', authenticateUser, (req, res) => {
  const { resume } = req.body;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: '招聘信息不存在' });
  }
  const existing = db.prepare('SELECT id FROM job_applications WHERE job_id = ? AND applicant_id = ?').get(req.params.id, req.user.id);
  if (existing) {
    return res.status(400).json({ error: '您已经申请过这个职位' });
  }
  const result = db.prepare(`
    INSERT INTO job_applications (job_id, applicant_id, resume)
    VALUES (?, ?, ?)
  `).run(req.params.id, req.user.id, resume);
  res.json({ message: '申请成功', application_id: result.lastInsertRowid });
});

router.post('/:id/sign', authenticateUser, (req, res) => {
  const { signer_name } = req.body;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: '招聘信息不存在' });
  }
  const application = db.prepare('SELECT * FROM job_applications WHERE job_id = ? AND applicant_id = ?').get(req.params.id, req.user.id);
  if (!application) {
    return res.status(400).json({ error: '请先申请该职位' });
  }
  const docContent = JSON.stringify({ job_id: job.id, applicant_id: req.user.id, terms: '电子劳务合同' });
  const documentHash = crypto.createHash('sha256').update(docContent).digest('hex');
  const signatureData = crypto.createHash('sha256').update(documentHash + signer_name + Date.now()).digest('hex');
  const result = db.prepare(`
    INSERT INTO e_signatures (job_id, applicant_id, employer_id, document_hash, signature_data, signer_name, signed_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(job.id, req.user.id, job.created_by, documentHash, signatureData, signer_name || req.user.real_name, new Date().toISOString(), 1);
  const signature = db.prepare('SELECT * FROM e_signatures WHERE id = ?').get(result.lastInsertRowid);
  res.json({ message: '电子签章成功', signature });
});

module.exports = router;
