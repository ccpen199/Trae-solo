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

function formatSettlement(row) {
  if (!row) return null;
  return { ...row, worker_bank_info: JSON.parse(row.worker_bank_info || '{}') };
}

router.post('/', auth, requireRole('employer'), (req, res) => {
  const { job_id, worker_id, amount, platform_fee, worker_bank_info } = req.body;
  if (!job_id || !worker_id || !amount) {
    return res.status(400).json(error('job_id、worker_id、amount 为必填'));
  }
  const db = getDb();
  const fee = platform_fee ?? Math.round(amount * 0.05 * 100) / 100;
  const actual_amount = Math.round((amount - fee) * 100) / 100;
  const result = db.prepare(
    `INSERT INTO settlements (job_id, employer_id, worker_id, amount, platform_fee, actual_amount, worker_bank_info)
     VALUES (?,?,?,?,?,?,?)`
  ).run(job_id, req.user.id, worker_id, amount, fee, actual_amount, JSON.stringify(worker_bank_info || {}));
  const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(result.lastInsertRowid);
  addAuditLog(req.user.id, 'create_settlement', 'settlement', result.lastInsertRowid, { job_id, worker_id, amount }, req.ip);
  res.json(success(formatSettlement(settlement)));
});

router.get('/', auth, (req, res) => {
  const { status, page = 1, pageSize = 10 } = req.query;
  const db = getDb();
  const conditions = ['(s.employer_id = ? OR s.worker_id = ?)'];
  const params = [req.user.id, req.user.id];
  if (status) { conditions.push('s.status = ?'); params.push(status); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM settlements s ${where}`).get(...params).cnt;
  const offset = (page - 1) * pageSize;
  const list = db.prepare(
    `SELECT s.*, j.title as job_title,
       e.nickname as employer_nickname, w.nickname as worker_nickname
     FROM settlements s
     LEFT JOIN jobs j ON s.job_id = j.id
     LEFT JOIN users e ON s.employer_id = e.id
     LEFT JOIN users w ON s.worker_id = w.id
     ${where}
     ORDER BY s.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset).map(formatSettlement);
  res.json(paginate(list, total, page, pageSize));
});

router.get('/:id', auth, (req, res) => {
  const db = getDb();
  const settlement = db.prepare(
    `SELECT s.*, j.title as job_title,
       e.nickname as employer_nickname, w.nickname as worker_nickname
     FROM settlements s
     LEFT JOIN jobs j ON s.job_id = j.id
     LEFT JOIN users e ON s.employer_id = e.id
     LEFT JOIN users w ON s.worker_id = w.id
     WHERE s.id = ?`
  ).get(req.params.id);
  if (!settlement) return res.status(404).json(error('结算记录不存在'));
  if (settlement.employer_id !== req.user.id && settlement.worker_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json(error('无权查看'));
  }
  res.json(success(formatSettlement(settlement)));
});

router.post('/:id/confirm', auth, requireRole('worker'), (req, res) => {
  const db = getDb();
  const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
  if (!settlement) return res.status(404).json(error('结算记录不存在'));
  if (settlement.worker_id !== req.user.id) return res.status(403).json(error('无权操作'));
  if (settlement.status !== 'frozen') return res.status(400).json(error('当前状态无法确认'));
  db.prepare("UPDATE settlements SET status = 'confirmed' WHERE id = ?").run(req.params.id);
  addAuditLog(req.user.id, 'confirm_settlement', 'settlement', Number(req.params.id), {}, req.ip);
  const updated = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
  res.json(success(formatSettlement(updated)));
});

router.post('/:id/release', auth, requireRole('employer'), (req, res) => {
  const db = getDb();
  const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
  if (!settlement) return res.status(404).json(error('结算记录不存在'));
  if (settlement.employer_id !== req.user.id) return res.status(403).json(error('无权操作'));
  if (settlement.status !== 'confirmed') return res.status(400).json(error('当前状态无法放款'));
  db.prepare(
    `UPDATE settlements SET status = 'released', released_at = datetime('now','localtime') WHERE id = ?`
  ).run(req.params.id);
  addAuditLog(req.user.id, 'release_settlement', 'settlement', Number(req.params.id), {}, req.ip);
  const updated = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
  res.json(success(formatSettlement(updated)));
});

export default router;
