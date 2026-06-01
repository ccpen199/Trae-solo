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

router.post('/reports', auth, (req, res) => {
  const { target_employer_id, job_id, report_type, description, location, lat, lng } = req.body;
  if (!report_type) return res.status(400).json(error('举报类型为必填'));
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO risk_reports (reporter_id, target_employer_id, job_id, report_type, description, location, lat, lng)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(req.user.id, target_employer_id || null, job_id || null, report_type, description || '', location || '', lat || 0, lng || 0);
  addAuditLog(req.user.id, 'submit_risk_report', 'risk_report', result.lastInsertRowid, { report_type, target_employer_id }, req.ip);
  const report = db.prepare('SELECT * FROM risk_reports WHERE id = ?').get(result.lastInsertRowid);
  res.json(success(report));
});

router.get('/reports', auth, requireRole('admin', 'platform', 'ops'), (req, res) => {
  const { status, page = 1, pageSize = 10 } = req.query;
  const db = getDb();
  const conditions = [];
  const params = [];
  if (status) { conditions.push('rr.status = ?'); params.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM risk_reports rr ${where}`).get(...params).cnt;
  const offset = (page - 1) * pageSize;
  const list = db.prepare(
    `SELECT rr.*, u.nickname as reporter_nickname, e.nickname as employer_nickname, j.title as job_title
     FROM risk_reports rr
     LEFT JOIN users u ON rr.reporter_id = u.id
     LEFT JOIN users e ON rr.target_employer_id = e.id
     LEFT JOIN jobs j ON rr.job_id = j.id
     ${where}
     ORDER BY rr.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset);
  res.json(paginate(list, total, page, pageSize));
});

router.put('/reports/:id', auth, requireRole('admin', 'platform', 'ops'), (req, res) => {
  const { status } = req.body;
  if (!['verified', 'dismissed'].includes(status)) {
    return res.status(400).json(error('状态仅支持 verified 或 dismissed'));
  }
  const db = getDb();
  const report = db.prepare('SELECT * FROM risk_reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json(error('举报记录不存在'));
  db.prepare('UPDATE risk_reports SET status = ? WHERE id = ?').run(status, req.params.id);
  if (status === 'verified' && report.target_employer_id) {
    const existing = db.prepare('SELECT id FROM blacklist WHERE employer_id = ?').get(report.target_employer_id);
    if (!existing) {
      db.prepare('INSERT INTO blacklist (employer_id, reason, reported_count) VALUES (?,?,?)').run(
        report.target_employer_id, report.report_type, 1
      );
    } else {
      db.prepare('UPDATE blacklist SET reported_count = reported_count + 1 WHERE employer_id = ?').run(report.target_employer_id);
    }
    db.prepare("UPDATE users SET status = 'banned' WHERE id = ?").run(report.target_employer_id);
  }
  addAuditLog(req.user.id, `risk_report_${status}`, 'risk_report', Number(req.params.id), { status }, req.ip);
  const updated = db.prepare('SELECT * FROM risk_reports WHERE id = ?').get(req.params.id);
  res.json(success(updated));
});

router.get('/map', (req, res) => {
  const db = getDb();
  const data = db.prepare(
    `SELECT lat, lng, COUNT(*) as count, GROUP_CONCAT(report_type) as types
     FROM risk_reports
     WHERE lat != 0 AND lng != 0 AND status != 'dismissed'
     GROUP BY ROUND(lat, 2), ROUND(lng, 2)
     ORDER BY count DESC
     LIMIT 200`
  ).all();
  res.json(success(data));
});

router.get('/blacklist', (req, res) => {
  const db = getDb();
  const list = db.prepare(
    `SELECT b.*, u.nickname as employer_nickname, u.phone as employer_phone
     FROM blacklist b LEFT JOIN users u ON b.employer_id = u.id
     ORDER BY b.created_at DESC`
  ).all();
  res.json(success(list));
});

export default router;
