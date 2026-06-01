import { Router } from 'express';
import { getDb } from '../db/init.js';
import { auth, requireRole } from '../middleware/auth.js';
import { success, error, paginate } from '../utils/response.js';

const router = Router();

function addAuditLog(userId, action, targetType, targetId, detail, ip) {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_logs (user_id, action, target_type, target_id, detail, ip_address) VALUES (?,?,?,?,?,?)`
  ).run(userId, action, targetType, targetId, JSON.stringify(detail || {}), ip || '');
}

router.get('/partners', (req, res) => {
  const { status, page = 1, pageSize = 10 } = req.query;
  const db = getDb();
  const conditions = [];
  const params = [];
  if (status) { conditions.push('status = ?'); params.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM university_partners ${where}`).get(...params).cnt;
  const offset = (page - 1) * pageSize;
  const list = db.prepare(
    `SELECT * FROM university_partners ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset);
  res.json(paginate(list, total, page, pageSize));
});

router.post('/partners', auth, requireRole('admin', 'university'), (req, res) => {
  const { university_name, contact_name, contact_phone, employment_office_code } = req.body;
  if (!university_name) return res.status(400).json(error('高校名称为必填'));
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO university_partners (university_name, contact_name, contact_phone, employment_office_code) VALUES (?,?,?,?)`
  ).run(university_name, contact_name || '', contact_phone || '', employment_office_code || '');
  const partner = db.prepare('SELECT * FROM university_partners WHERE id = ?').get(result.lastInsertRowid);
  addAuditLog(req.user.id, 'create_university_partner', 'university_partner', result.lastInsertRowid, { university_name }, req.ip);
  res.json(success(partner));
});

router.post('/certificates', auth, requireRole('admin', 'university'), (req, res) => {
  const { worker_id, job_id, university_partner_id, cert_number } = req.body;
  if (!worker_id || !job_id || !university_partner_id || !cert_number) {
    return res.status(400).json(error('所有字段为必填'));
  }
  const db = getDb();
  const existing = db.prepare('SELECT id FROM internship_certificates WHERE cert_number = ?').get(cert_number);
  if (existing) return res.status(409).json(error('证书编号已存在'));
  const result = db.prepare(
    `INSERT INTO internship_certificates (worker_id, job_id, university_partner_id, cert_number) VALUES (?,?,?,?)`
  ).run(worker_id, job_id, university_partner_id, cert_number);
  const cert = db.prepare('SELECT * FROM internship_certificates WHERE id = ?').get(result.lastInsertRowid);
  addAuditLog(req.user.id, 'issue_certificate', 'internship_certificate', result.lastInsertRowid, { cert_number, worker_id }, req.ip);
  res.json(success(cert));
});

router.get('/certificates', auth, (req, res) => {
  const db = getDb();
  let list;
  if (['admin', 'university'].includes(req.user.role)) {
    list = db.prepare(
      `SELECT ic.*, u.nickname as worker_nickname, j.title as job_title, up.university_name
       FROM internship_certificates ic
       LEFT JOIN users u ON ic.worker_id = u.id
       LEFT JOIN jobs j ON ic.job_id = j.id
       LEFT JOIN university_partners up ON ic.university_partner_id = up.id
       ORDER BY ic.issued_at DESC`
    ).all();
  } else {
    list = db.prepare(
      `SELECT ic.*, j.title as job_title, up.university_name
       FROM internship_certificates ic
       LEFT JOIN jobs j ON ic.job_id = j.id
       LEFT JOIN university_partners up ON ic.university_partner_id = up.id
       WHERE ic.worker_id = ?
       ORDER BY ic.issued_at DESC`
    ).all(req.user.id);
  }
  res.json(success(list));
});

router.post('/push-rules', auth, requireRole('admin', 'university'), (req, res) => {
  const { university_partner_id, category, keywords, target_roles } = req.body;
  if (!university_partner_id) return res.status(400).json(error('高校合作方ID为必填'));
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO job_push_rules (university_partner_id, category, keywords, target_roles) VALUES (?,?,?,?)`
  ).run(university_partner_id, category || '', JSON.stringify(keywords || []), JSON.stringify(target_roles || []));
  const rule = db.prepare('SELECT * FROM job_push_rules WHERE id = ?').get(result.lastInsertRowid);
  addAuditLog(req.user.id, 'create_push_rule', 'job_push_rule', result.lastInsertRowid, { university_partner_id, category }, req.ip);
  res.json(success({ ...rule, keywords: JSON.parse(rule.keywords || '[]'), target_roles: JSON.parse(rule.target_roles || '[]') }));
});

router.get('/push-rules', auth, (req, res) => {
  const db = getDb();
  const list = db.prepare(
    `SELECT jpr.*, up.university_name
     FROM job_push_rules jpr
     LEFT JOIN university_partners up ON jpr.university_partner_id = up.id
     ORDER BY jpr.created_at DESC`
  ).all().map(r => ({
    ...r,
    keywords: JSON.parse(r.keywords || '[]'),
    target_roles: JSON.parse(r.target_roles || '[]'),
  }));
  res.json(success(list));
});

export default router;
