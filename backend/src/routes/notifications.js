const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { auth } = require('../middleware/auth');

router.get('/unread-count', auth, (req, res) => {
  try {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).cnt;
    res.json({ code: 0, data: { count }, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/', auth, (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const total = db.prepare('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ?').get(req.user.id).cnt;

    const notifications = db.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(req.user.id, parseInt(pageSize), offset);

    res.json({
      code: 0,
      data: { list: notifications, total, page: parseInt(page), pageSize: parseInt(pageSize) },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.put('/:id/read', auth, (req, res) => {
  try {
    const notif = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!notif) {
      return res.status(404).json({ code: 1, message: '通知不存在' });
    }
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ code: 0, data: null, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.put('/read-all', auth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
    res.json({ code: 0, data: null, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

module.exports = router;
