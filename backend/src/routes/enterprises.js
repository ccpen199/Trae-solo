const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage });

router.get('/profile', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  let enterprise;
  if (req.user.role === 'admin') {
    enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(req.query.enterprise_id || 1);
  } else {
    enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);
  }
  
  if (!enterprise) {
    return res.status(404).json({ error: '企业信息不存在' });
  }

  const jobCount = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE enterprise_id = ?').get(enterprise.id).count;
  const applicationCount = db.prepare(`
    SELECT COUNT(*) as count FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE j.enterprise_id = ?
  `).get(enterprise.id).count;

  res.json({ enterprise, stats: { jobCount, applicationCount } });
});

router.put('/profile', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);
  if (!enterprise) {
    return res.status(404).json({ error: '企业信息不存在' });
  }

  const {
    enterprise_name, unified_credit_code, industry, scale,
    address, contact_person, contact_phone
  } = req.body;

  db.prepare(`
    UPDATE enterprises SET
      enterprise_name = COALESCE(?, enterprise_name),
      unified_credit_code = COALESCE(?, unified_credit_code),
      industry = COALESCE(?, industry),
      scale = COALESCE(?, scale),
      address = COALESCE(?, address),
      contact_person = COALESCE(?, contact_person),
      contact_phone = COALESCE(?, contact_phone),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(enterprise_name, unified_credit_code, industry, scale, address,
         contact_person, contact_phone, enterprise.id);

  logAction('update_enterprise_profile', req, 'enterprise', enterprise.id, '更新企业资料');

  res.json({ success: true });
});

router.post('/qualification', authenticateJWT, requireRole('hr'), upload.fields([
  { name: 'business_license', maxCount: 1 },
  { name: 'iso_certification', maxCount: 1 },
]), (req, res) => {
  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);
  if (!enterprise) {
    return res.status(404).json({ error: '企业信息不存在' });
  }

  const businessLicense = req.files?.business_license?.[0]?.filename || null;
  const isoCertification = req.files?.iso_certification?.[0]?.filename || null;

  db.prepare(`
    UPDATE enterprises SET
      business_license = COALESCE(?, business_license),
      iso_certification = COALESCE(?, iso_certification),
      qualification_status = 'pending',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(businessLicense, isoCertification, enterprise.id);

  logAction('submit_qualification', req, 'enterprise', enterprise.id, '提交资质审核');

  res.json({ success: true });
});

router.get('/my-jobs', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);
  const { status, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT j.*, c.category_name,
           (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as application_count
    FROM jobs j
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    WHERE j.enterprise_id = ?
  `;
  const params = [req.user.role === 'admin' ? '%' : enterprise.id];
  
  if (req.user.role === 'admin') {
    sql = sql.replace('j.enterprise_id = ?', '1=1');
    params.shift();
  }
  
  if (status) {
    sql += ' AND j.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), parseInt(offset));

  const jobs = db.prepare(sql).all(...params);

  res.json({
    jobs: jobs.map(j => ({
      ...j,
      ability_model: j.ability_model ? JSON.parse(j.ability_model) : null,
    })),
  });
});

module.exports = router;
