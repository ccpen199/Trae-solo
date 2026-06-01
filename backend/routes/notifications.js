const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, unreadOnly } = req.query;
    
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];
    
    if (unreadOnly === 'true') {
      query += ' AND is_read = 0';
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const notifications = db.prepare(query).all(...params);
    res.success(notifications);
  } catch (err) {
    res.error('获取通知失败', err.message);
  }
});

router.post('/:notificationId/read', (req, res) => {
  try {
    const { notificationId } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notificationId);
    res.success(null, '标记已读成功');
  } catch (err) {
    res.error('标记已读失败', err.message);
  }
});

router.post('/user/:userId/read-all', (req, res) => {
  try {
    const { userId } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    res.success(null, '全部已读');
  } catch (err) {
    res.error('操作失败', err.message);
  }
});

module.exports = router;
