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

router.get('/dashboard', auth, requireRole('admin', 'platform', 'ops'), (req, res) => {
  const db = getDb();
  const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  const totalWorkers = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'worker'").get().cnt;
  const totalEmployers = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'employer'").get().cnt;
  const totalJobs = db.prepare('SELECT COUNT(*) as cnt FROM jobs').get().cnt;
  const pendingReviewJobs = db.prepare("SELECT COUNT(*) as cnt FROM jobs WHERE status = 'pending_review'").get().cnt;
  const approvedJobs = db.prepare("SELECT COUNT(*) as cnt FROM jobs WHERE status = 'approved'").get().cnt;
  const totalApplications = db.prepare('SELECT COUNT(*) as cnt FROM job_applications').get().cnt;
  const totalSettlements = db.prepare('SELECT COUNT(*) as cnt FROM settlements').get().cnt;
  const totalSettlementAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM settlements').get().total;
  const pendingReports = db.prepare("SELECT COUNT(*) as cnt FROM risk_reports WHERE status = 'pending'").get().cnt;
  const verifiedReports = db.prepare("SELECT COUNT(*) as cnt FROM risk_reports WHERE status = 'verified'").get().cnt;
  const pendingAlerts = db.prepare("SELECT COUNT(*) as cnt FROM opinion_alerts WHERE status = 'pending'").get().cnt;
  const totalBlacklist = db.prepare('SELECT COUNT(*) as cnt FROM blacklist').get().cnt;
  const mediumRiskJobs = db.prepare("SELECT COUNT(*) as cnt FROM jobs WHERE safety_level = 2").get().cnt;
  const highRiskJobs = db.prepare("SELECT COUNT(*) as cnt FROM jobs WHERE safety_level = 3").get().cnt;
  res.json(success({
    totalUsers,
    totalWorkers,
    totalEmployers,
    totalJobs,
    pendingReviewJobs,
    approvedJobs,
    totalApplications,
    totalSettlements,
    totalSettlementAmount,
    pendingReports,
    verifiedReports,
    pendingAlerts,
    totalBlacklist,
    mediumRiskJobs,
    highRiskJobs,
  }));
});

router.get('/users', auth, requireRole('admin', 'ops'), (req, res) => {
  const { search, role, status, page = 1, pageSize = 10 } = req.query;
  const db = getDb();
  const conditions = [];
  const params = [];
  if (search) {
    conditions.push('(phone LIKE ? OR nickname LIKE ? OR username LIKE ? OR employer_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (role) { conditions.push('role = ?'); params.push(role); }
  if (status) { conditions.push('status = ?'); params.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM users ${where}`).get(...params).cnt;
  const offset = (page - 1) * pageSize;
  const list = db.prepare(
    `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset).map(row => {
    const { password_hash, ...rest } = row;
    return { ...rest, identity_tags: JSON.parse(rest.identity_tags || '[]'), skill_certs: JSON.parse(rest.skill_certs || '[]') };
  });
  res.json(paginate(list, total, page, pageSize));
});

router.put('/users/:id', auth, requireRole('admin', 'ops'), (req, res) => {
  const { status, credit_score } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json(error('用户不存在'));
  const fields = [];
  const values = [];
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (credit_score !== undefined) { fields.push('credit_score = ?'); values.push(Number(credit_score)); }
  if (fields.length === 0) return res.status(400).json(error('无更新字段'));
  fields.push("updated_at = datetime('now','localtime')");
  values.push(req.params.id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  addAuditLog(req.user.id, 'admin_update_user', 'user', Number(req.params.id), { status, credit_score }, req.ip);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  const { password_hash, ...rest } = updated;
  res.json(success({ ...rest, identity_tags: JSON.parse(rest.identity_tags || '[]'), skill_certs: JSON.parse(rest.skill_certs || '[]') }));
});

router.get('/opinion-alerts', auth, requireRole('admin', 'platform', 'ops'), (req, res) => {
  const { status, page = 1, pageSize = 10 } = req.query;
  const db = getDb();
  const conditions = [];
  const params = [];
  if (status) { conditions.push('oa.status = ?'); params.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM opinion_alerts oa ${where}`).get(...params).cnt;
  const offset = (page - 1) * pageSize;
  const list = db.prepare(
    `SELECT oa.*, j.title as job_title
     FROM opinion_alerts oa
     LEFT JOIN jobs j ON oa.job_id = j.id
     ${where}
     ORDER BY oa.risk_score DESC, oa.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset);
  res.json(paginate(list, total, page, pageSize));
});

router.put('/opinion-alerts/:id', auth, requireRole('admin', 'platform', 'ops'), (req, res) => {
  const { status } = req.body;
  if (!['reviewed', 'dismissed'].includes(status)) {
    return res.status(400).json(error('状态仅支持 reviewed 或 dismissed'));
  }
  const db = getDb();
  const alert = db.prepare('SELECT * FROM opinion_alerts WHERE id = ?').get(req.params.id);
  if (!alert) return res.status(404).json(error('预警不存在'));
  db.prepare('UPDATE opinion_alerts SET status = ? WHERE id = ?').run(status, req.params.id);
  addAuditLog(req.user.id, `opinion_alert_${status}`, 'opinion_alert', Number(req.params.id), { status }, req.ip);
  const updated = db.prepare('SELECT * FROM opinion_alerts WHERE id = ?').get(req.params.id);
  res.json(success(updated));
});

router.get('/audit-logs', auth, requireRole('admin', 'ops'), (req, res) => {
  const { action, user_id, page = 1, pageSize = 20 } = req.query;
  const db = getDb();
  const conditions = [];
  const params = [];
  if (action) { conditions.push('action = ?'); params.push(action); }
  if (user_id) { conditions.push('user_id = ?'); params.push(Number(user_id)); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM audit_logs ${where}`).get(...params).cnt;
  const offset = (page - 1) * pageSize;
  const list = db.prepare(
    `SELECT al.*, u.nickname as user_nickname
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ${where}
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset).map(r => ({ ...r, detail: JSON.parse(r.detail || '{}') }));
  res.json(paginate(list, total, page, pageSize));
});

export default router;
