const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const sensitiveWords = ['赌博', '色情', '诈骗', '传销', '毒品', '暴力', '恐怖', '假证', '洗钱'];

function filterSensitiveWords(content) {
  let filtered = content;
  let hasSensitive = false;
  sensitiveWords.forEach(word => {
    if (filtered.includes(word)) {
      hasSensitive = true;
      filtered = filtered.replace(new RegExp(word, 'g'), '*'.repeat(word.length));
    }
  });
  return { filtered, hasSensitive };
}

router.post('/', authenticateToken, (req, res) => {
  const { receiverId, applicationId, content, messageType = 'text', attachmentUrl } = req.body;

  try {
    const { filtered, hasSensitive } = filterSensitiveWords(content);

    if (hasSensitive) {
      db.prepare(`
        INSERT INTO reports (reporter_id, reported_type, reported_id, reason, description, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(1, 'message', 0, '敏感词检测', `自动检测到敏感词: ${content}`, 'pending');
    }

    db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, application_id, content, message_type, attachment_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, receiverId, applicationId || null, filtered, messageType, attachmentUrl || null);

    res.json({ message: '发送成功', content: filtered });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: '发送失败' });
  }
});

router.get('/conversation/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const messages = db.prepare(`
      SELECT m.*, 
        CASE WHEN m.sender_id = ? THEN 'me' ELSE 'other' END as direction
      FROM messages m
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, req.user.id, userId, userId, req.user.id, parseInt(limit), parseInt(offset));

    db.prepare(`
      UPDATE messages 
      SET is_read = 1 
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(userId, req.user.id);

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: '获取消息失败' });
  }
});

router.get('/unread/count', authenticateToken, (req, res) => {
  try {
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0
    `).get(req.user.id);

    res.json({ count: count.count });
  } catch (error) {
    res.status(500).json({ error: '获取未读消息数失败' });
  }
});

router.get('/conversations', authenticateToken, (req, res) => {
  try {
    const conversations = db.prepare(`
      SELECT 
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as user_id,
        MAX(m.created_at) as last_message_time,
        SUM(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread_count
      FROM messages m
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY user_id
      ORDER BY last_message_time DESC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id);

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: '获取会话列表失败' });
  }
});

module.exports = router;
