import express from 'express';
import db from '../database/index.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/:userId', rateLimit('report'), (req, res) => {
  const reportedUserId = parseInt(req.params.userId);
  const { type, description } = req.body;

  if (reportedUserId === req.user.id) {
    return res.status(400).json({ error: '不能举报自己' });
  }

  if (!type) {
    return res.status(400).json({ error: '请选择举报类型' });
  }

  db.prepare(`
    INSERT INTO reports (reporter_id, reported_user_id, type, description, status)
    VALUES (?, ?, ?, ?, 0)
  `).run(req.user.id, reportedUserId, type, description || '');

  db.prepare(`
    INSERT INTO action_logs (user_id, action, target_id, details)
    VALUES (?, 'report', ?, ?)
  `).run(req.user.id, reportedUserId, JSON.stringify({ type, description }));

  const reportCount = db.prepare(`
    SELECT COUNT(*) as count FROM reports 
    WHERE reported_user_id = ? AND status = 0
  `).get(reportedUserId).count;

  if (reportCount >= 3) {
    db.prepare(`
      INSERT OR IGNORE INTO risk_records (user_id, type, description, severity)
      VALUES (?, 'multiple_reports', ?, 2)
    `).run(reportedUserId, `累计收到 ${reportCount} 条举报`);
  }

  res.json({ success: true });
});

router.get('/history', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  const list = db.prepare(`
    SELECT r.*, u.nickname as reported_nickname, u.avatar as reported_avatar
    FROM reports r
    JOIN users u ON r.reported_user_id = u.id
    WHERE r.reporter_id = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, parseInt(pageSize), offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM reports WHERE reporter_id = ?').get(req.user.id).count;

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/queue', adminMiddleware, (req, res) => {
  const { status = 0, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  const list = db.prepare(`
    SELECT r.*, 
           ru.nickname as reported_nickname, 
           ru.username as reported_username,
           ru.avatar as reported_avatar,
           su.nickname as reporter_nickname
    FROM reports r
    JOIN users ru ON r.reported_user_id = ru.id
    JOIN users su ON r.reporter_id = su.id
    WHERE r.status = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(status), parseInt(pageSize), offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM reports WHERE status = ?').get(parseInt(status)).count;

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/:reportId/handle', adminMiddleware, (req, res) => {
  const reportId = parseInt(req.params.reportId);
  const { action, reason } = req.body;

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId);
  if (!report) {
    return res.status(404).json({ error: '举报不存在' });
  }

  let newStatus = 1;
  if (action === 'ban') {
    db.prepare('UPDATE users SET status = 0 WHERE id = ?').run(report.reported_user_id);
    db.prepare(`
      INSERT INTO risk_records (user_id, type, description, severity, status, handler_id)
      VALUES (?, 'admin_ban', ?, 3, 1, ?)
    `).run(report.reported_user_id, reason || '管理员封禁', req.user.id);
    newStatus = 1;
  } else if (action === 'warn') {
    db.prepare(`
      INSERT INTO risk_records (user_id, type, description, severity, status, handler_id)
      VALUES (?, 'admin_warn', ?, 1, 1, ?)
    `).run(report.reported_user_id, reason || '管理员警告', req.user.id);
    newStatus = 1;
  } else if (action === 'ignore') {
    newStatus = 2;
  }

  db.prepare(`
    UPDATE reports 
    SET status = ?, handler_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, req.user.id, reportId);

  res.json({ success: true });
});

export default router;
