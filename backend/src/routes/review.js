const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { auth, requireRole } = require('../middleware/auth');

router.get('/pending', auth, requireRole('admin', 'author'), (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const total = db.prepare('SELECT COUNT(*) as cnt FROM contents WHERE review_status = \'pending\' AND status = \'active\'').get().cnt;

    const contents = db.prepare(`
      SELECT c.*, u.nickname as author_nickname, u.avatar as author_avatar
      FROM contents c
      JOIN users u ON c.user_id = u.id
      WHERE c.review_status = 'pending' AND c.status = 'active'
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?
    `).all(parseInt(pageSize), offset);

    res.json({
      code: 0,
      data: { list: contents, total, page: parseInt(page), pageSize: parseInt(pageSize) },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/:contentId/approve', auth, requireRole('admin'), (req, res) => {
  try {
    const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(req.params.contentId);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    const now = new Date().toISOString();
    const logId = uuidv4();

    db.prepare('UPDATE contents SET review_status = \'approved\', reviewer_id = ?, reviewed_at = ?, review_note = ? WHERE id = ?')
      .run(req.user.id, now, '人工审核通过', req.params.contentId);

    db.prepare(
      'INSERT INTO review_logs (id, content_id, reviewer_id, review_type, action, note, created_at) VALUES (?, ?, ?, \'manual\', \'approve\', ?, ?)'
    ).run(logId, req.params.contentId, req.user.id, '人工审核通过', now);

    db.prepare('UPDATE users SET creator_score = creator_score + 10 WHERE id = ?').run(content.user_id);

    res.json({ code: 0, data: null, message: '审核通过' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/:contentId/reject', auth, requireRole('admin'), (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ code: 1, message: '请提供拒绝原因' });
    }

    const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(req.params.contentId);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    const now = new Date().toISOString();
    const logId = uuidv4();

    db.prepare('UPDATE contents SET review_status = \'rejected\', reviewer_id = ?, reviewed_at = ?, review_note = ? WHERE id = ?')
      .run(req.user.id, now, reason, req.params.contentId);

    db.prepare(
      'INSERT INTO review_logs (id, content_id, reviewer_id, review_type, action, note, created_at) VALUES (?, ?, ?, \'manual\', \'reject\', ?, ?)'
    ).run(logId, req.params.contentId, req.user.id, reason, now);

    res.json({ code: 0, data: null, message: '已拒绝' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/:contentId/logs', auth, (req, res) => {
  try {
    const content = db.prepare('SELECT id FROM contents WHERE id = ?').get(req.params.contentId);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    const logs = db.prepare(`
      SELECT rl.*, u.nickname as reviewer_nickname
      FROM review_logs rl
      LEFT JOIN users u ON rl.reviewer_id = u.id
      WHERE rl.content_id = ?
      ORDER BY rl.created_at DESC
    `).all(req.params.contentId);

    res.json({ code: 0, data: logs, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

module.exports = router;
