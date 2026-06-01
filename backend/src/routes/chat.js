const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { parseIntent } = require('../utils/intentParser');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../data/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', authenticateToken, (req, res) => {
  let chats;
  
  if (req.user.role === 'jobseeker') {
    const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
    chats = db.prepare(`
      SELECT c.*, j.title as job_title, u.username as hr_name, u.avatar as hr_avatar,
             c.last_message, c.last_message_at
      FROM chats c
      LEFT JOIN jobs j ON c.job_id = j.id
      JOIN users u ON c.hr_id = u.id
      WHERE c.jobseeker_id = ?
      ORDER BY c.last_message_at DESC
    `).all(jobseeker.id);
  } else if (req.user.role === 'hr') {
    chats = db.prepare(`
      SELECT c.*, j.title as job_title, js.real_name as jobseeker_name,
             u.avatar as jobseeker_avatar, c.last_message, c.last_message_at
      FROM chats c
      LEFT JOIN jobs j ON c.job_id = j.id
      JOIN jobseekers js ON c.jobseeker_id = js.id
      JOIN users u ON js.user_id = u.id
      WHERE c.hr_id = ?
      ORDER BY c.last_message_at DESC
    `).all(req.user.id);
  }

  res.json({ chats });
});

router.post('/', authenticateToken, (req, res) => {
  const { target_user_id, job_id } = req.body;
  
  let chat;
  
  if (req.user.role === 'jobseeker') {
    const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
    chat = db.prepare(`
      SELECT * FROM chats WHERE jobseeker_id = ? AND hr_id = ? ${job_id ? 'AND job_id = ?' : ''}
    `).get(jobseeker.id, target_user_id, ...(job_id ? [job_id] : []));
    
    if (!chat) {
      const result = db.prepare(`
        INSERT INTO chats (jobseeker_id, hr_id, job_id) VALUES (?, ?, ?)
      `).run(jobseeker.id, target_user_id, job_id || null);
      chat = { id: result.lastInsertRowid };
    }
  } else if (req.user.role === 'hr') {
    chat = db.prepare(`
      SELECT * FROM chats WHERE jobseeker_id = ? AND hr_id = ? ${job_id ? 'AND job_id = ?' : ''}
    `).get(target_user_id, req.user.id, ...(job_id ? [job_id] : []));
    
    if (!chat) {
      const result = db.prepare(`
        INSERT INTO chats (jobseeker_id, hr_id, job_id) VALUES (?, ?, ?)
      `).run(target_user_id, req.user.id, job_id || null);
      chat = { id: result.lastInsertRowid };
    }
  }

  res.json({ chat_id: chat.id });
});

router.get('/:chatId/messages', authenticateToken, (req, res) => {
  const chatId = req.params.chatId;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  let hasAccess = false;
  if (req.user.role === 'jobseeker') {
    const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
    hasAccess = chat.jobseeker_id === jobseeker.id;
  } else if (req.user.role === 'hr') {
    hasAccess = chat.hr_id === req.user.id;
  }

  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const messages = db.prepare(`
    SELECT m.*, u.username as sender_name
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.chat_id = ?
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(chatId, parseInt(limit), parseInt(offset)).reverse();

  messages.forEach(m => {
    if (m.intent_data) m.intent_data = JSON.parse(m.intent_data);
  });

  db.prepare(`
    UPDATE messages SET is_read = 1
    WHERE chat_id = ? AND sender_id != ? AND is_read = 0
  `).run(chatId, req.user.id);

  res.json({ messages });
});

router.post('/:chatId/messages', authenticateToken, (req, res) => {
  const chatId = req.params.chatId;
  const { content, type = 'text', file_url, file_name, duration } = req.body;

  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  if (!content && type === 'text') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const intent = type === 'text' && content ? parseIntent(content) : null;
  const intentType = intent ? intent.type : null;
  const intentData = intent ? JSON.stringify(intent.data) : null;

  const result = db.prepare(`
    INSERT INTO messages (chat_id, sender_id, content, type, file_url, file_name, duration, intent, intent_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(chatId, req.user.id, content, type, file_url, file_name, duration, intentType, intentData);

  db.prepare(`
    UPDATE chats SET last_message = ?, last_message_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(content || `[${type}]`, chatId);

  if (intent && intent.type === 'interview_request') {
    db.prepare(`
      INSERT INTO schedule_suggestions (chat_id, message_id, suggested_date, suggested_time)
      VALUES (?, ?, ?, ?)
    `).run(chatId, result.lastInsertRowid, 
           intent.data.suggested_date || null,
           intent.data.suggested_time || null);
  }

  const io = require('../app').io;
  io.to(`chat_${chatId}`).emit('new_message', {
    id: result.lastInsertRowid,
    chat_id: chatId,
    sender_id: req.user.id,
    content,
    type,
    intent: intentType,
    intent_data: intent ? intent.data : null,
    created_at: new Date().toISOString()
  });

  res.json({ 
    message_id: result.lastInsertRowid, 
    intent: intentType,
    intent_data: intent ? intent.data : null
  });
});

router.post('/:chatId/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const chatId = req.params.chatId;
  const fileType = req.file.mimetype.startsWith('audio/') ? 'voice' : 
                   req.file.mimetype.startsWith('image/') ? 'image' : 'file';

  const fileUrl = `/uploads/${req.file.filename}`;

  const result = db.prepare(`
    INSERT INTO messages (chat_id, sender_id, content, type, file_url, file_name, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(chatId, req.user.id, null, fileType, fileUrl, req.file.originalname, null);

  db.prepare(`
    UPDATE chats SET last_message = ?, last_message_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(`[${fileType}]`, chatId);

  res.json({
    message_id: result.lastInsertRowid,
    file_url: fileUrl,
    type: fileType
  });
});

module.exports = router;
