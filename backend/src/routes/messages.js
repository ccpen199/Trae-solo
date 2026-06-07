import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { is_read, type, page = 1, pageSize = 20 } = req.query;
  
  let query = 'SELECT * FROM messages WHERE student_id = ?';
  const params = [req.user.studentId];
  
  if (is_read !== undefined) {
    query += ' AND is_read = ?';
    params.push(is_read === 'true' ? 1 : 0);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const messages = db.prepare(query).all(...params);
  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE student_id = ? AND is_read = 0').get(req.user.studentId).count;
  
  res.json({ messages, unreadCount });
});

router.post('/:id/read', authenticateToken, (req, res) => {
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  
  if (!message) {
    return res.status(404).json({ error: '消息不存在' });
  }
  
  if (message.student_id !== req.user.studentId) {
    return res.status(403).json({ error: '无权限操作' });
  }
  
  db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(req.params.id);
  
  res.json({ success: true });
});

router.post('/read-all', authenticateToken, (req, res) => {
  db.prepare('UPDATE messages SET is_read = 1 WHERE student_id = ?').run(req.user.studentId);
  res.json({ success: true });
});

export default router;
