const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/unread-count', (req, res) => {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM messages WHERE read = 0').get();
    res.json({ success: true, data: count.count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE messages SET read = 1 WHERE id = ?').run(id);
    res.json({ success: true, message: '消息已标记为已读' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
