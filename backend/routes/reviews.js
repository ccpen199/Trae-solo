import { Router } from 'express';
import db from '../db.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/report/:roomId', auth, (req, res) => {
  const { target_user_id, reason, description, evidence } = req.body;
  if (!reason) return res.status(400).json({ error: '举报原因必填' });
  const info = db.prepare(`
    INSERT INTO reports (room_id, reporter_id, target_user_id, reason, description, evidence)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.roomId, req.user.id, target_user_id || null, reason, description || '', evidence || '');
  res.json({ id: info.lastInsertRowid, message: '举报已提交' });
});

router.get('/reports', auth, requireRole('reviewer', 'admin', 'operator'), (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  let sql = `
    SELECT r.*, u1.nickname as reporter_name, u2.nickname as target_name,
      rm.topic as room_topic, u3.nickname as reviewed_by_name
    FROM reports r
    LEFT JOIN users u1 ON r.reporter_id = u1.id
    LEFT JOIN users u2 ON r.target_user_id = u2.id
    LEFT JOIN rooms rm ON r.room_id = rm.id
    LEFT JOIN users u3 ON r.reviewed_by = u3.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  const reports = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as cnt FROM reports' + (status ? ' WHERE status = ?' : ''))
    .get(...(status ? [status] : [])).cnt;
  res.json({ reports, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/report/review/:id', auth, requireRole('reviewer', 'admin'), (req, res) => {
  const { conclusion, action } = req.body;
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: '举报不存在' });
  if (report.status !== 'pending' && report.status !== 'reviewing') {
    return res.status(400).json({ error: '已处理' });
  }
  const tx = db.transaction(() => {
    db.prepare(`UPDATE reports SET status = 'reviewed', reviewed_at = datetime('now','localtime'),
      reviewed_by = ?, conclusion = ? WHERE id = ?`)
      .run(req.user.id, conclusion || '', report.id);
    if (action && ['warning', 'mute', 'kick', 'ban'].includes(action) && report.target_user_id) {
      const severity = action === 'ban' ? 'severe' : action === 'kick' ? 'major' : 'minor';
      db.prepare(`INSERT INTO violations (user_id, room_id, type, description, severity, action)
        VALUES (?, ?, 'report', ?, ?, ?)`)
        .run(report.target_user_id, report.room_id, conclusion || report.reason, severity, action);
      if (action === 'ban') {
        db.prepare('UPDATE users SET banned = 1 WHERE id = ?').run(report.target_user_id);
      }
    }
  });
  tx();
  res.json({ message: '处理完成' });
});

router.get('/items', auth, requireRole('reviewer', 'admin', 'operator'), (req, res) => {
  const { status, type, page = 1, pageSize = 20 } = req.query;
  let sql = `
    SELECT ri.*, u.nickname as user_name, rm.topic as room_topic,
      u2.nickname as reviewed_by_name
    FROM review_items ri
    LEFT JOIN users u ON ri.user_id = u.id
    LEFT JOIN rooms rm ON ri.room_id = rm.id
    LEFT JOIN users u2 ON ri.reviewed_by = u2.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND ri.status = ?'; params.push(status); }
  if (type) { sql += ' AND ri.type = ?'; params.push(type); }
  sql += ' ORDER BY ri.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  const items = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as cnt FROM review_items WHERE 1=1' +
    (status ? ' AND status = ?' : '') + (type ? ' AND type = ?' : ''))
    .get(...(status ? [status] : []).concat(type ? [type] : [])).cnt;
  res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/item/review/:id', auth, requireRole('reviewer', 'admin'), (req, res) => {
  const { conclusion, action } = req.body;
  const item = db.prepare('SELECT * FROM review_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: '审核项不存在' });
  if (item.status !== 'pending') return res.status(400).json({ error: '已处理' });
  const tx = db.transaction(() => {
    db.prepare(`UPDATE review_items SET status = 'reviewed', reviewed_at = datetime('now','localtime'),
      reviewed_by = ?, conclusion = ? WHERE id = ?`)
      .run(req.user.id, conclusion || '', item.id);
    if (action && item.user_id) {
      const severity = action === 'ban' ? 'severe' : action === 'kick' ? 'major' : 'minor';
      db.prepare(`INSERT INTO violations (user_id, room_id, type, description, severity, action)
        VALUES (?, ?, 'review', ?, ?, ?)`)
        .run(item.user_id, item.room_id, conclusion || item.description, severity, action);
      if (action === 'ban') {
        db.prepare('UPDATE users SET banned = 1 WHERE id = ?').run(item.user_id);
      }
    }
  });
  tx();
  res.json({ message: '处理完成' });
});

router.get('/violations', auth, requireRole('reviewer', 'admin', 'operator'), (req, res) => {
  const { userId, page = 1, pageSize = 20 } = req.query;
  let sql = `
    SELECT v.*, u.nickname as user_name, rm.topic as room_topic
    FROM violations v
    LEFT JOIN users u ON v.user_id = u.id
    LEFT JOIN rooms rm ON v.room_id = rm.id WHERE 1=1
  `;
  const params = [];
  if (userId) { sql += ' AND v.user_id = ?'; params.push(userId); }
  sql += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  const violations = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as cnt FROM violations' + (userId ? ' WHERE user_id = ?' : ''))
    .get(...(userId ? [userId] : [])).cnt;
  res.json({ violations, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/violations/stats', auth, requireRole('admin', 'operator'), (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as cnt FROM violations').get().cnt;
  const bySeverity = db.prepare(`
    SELECT severity, COUNT(*) as cnt FROM violations GROUP BY severity
  `).all();
  const byType = db.prepare(`
    SELECT type, COUNT(*) as cnt FROM violations GROUP BY type
  `).all();
  res.json({ total, bySeverity, byType });
});

export default router;
