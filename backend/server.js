require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 55866;

app.use(cors({ origin: 'http://127.0.0.1:45866' }));
app.use(express.json());

const getCurrentUserId = (req) => {
  const userId = req.headers['x-user-id'];
  return userId ? parseInt(userId) : 1;
};

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/me', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.json(user || { id: 1, name: '默认用户' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/conversations', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const conversations = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.type,
        cm.is_pinned,
        cm.is_muted,
        c.last_message_at,
        cm.unread_count,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_sender_id,
        (SELECT status FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_status,
        d.content as draft_content,
        GROUP_CONCAT(u.name) as member_names,
        GROUP_CONCAT(u.avatar) as member_avatars
      FROM conversations c
      JOIN conversation_members cm ON c.id = cm.conversation_id
      LEFT JOIN drafts d ON c.id = d.conversation_id AND d.user_id = ?
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.user_id = ?
      GROUP BY c.id
      ORDER BY cm.is_pinned DESC, c.last_message_at DESC
    `).all(userId, userId);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/conversations/:id/messages', (req, res) => {
  try {
    const { id } = req.params;
    const userId = getCurrentUserId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const messages = db.prepare(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.status,
        m.created_at,
        u.name as sender_name,
        u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(id, limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?').get(id);

    db.prepare('UPDATE conversation_members SET unread_count = 0 WHERE conversation_id = ? AND user_id = ?').run(id, userId);

    res.json({ messages: messages.reverse(), total: total.count, page, limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages', (req, res) => {
  try {
    const { conversation_id, content } = req.body;
    
    if (!conversation_id || !content?.trim()) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const userId = getCurrentUserId(req);
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO messages (conversation_id, sender_id, content, status, created_at)
      VALUES (?, ?, ?, 'sending', ?)
    `).run(conversation_id, userId, content.trim(), now);

    db.prepare('UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE id = ?').run(now, now, conversation_id);

    const message = db.prepare(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.status,
        m.created_at,
        u.name as sender_name,
        u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.json(message);

    setTimeout(() => {
      const shouldFail = Math.random() < 0.1;
      const newStatus = shouldFail ? 'failed' : 'sent';
      db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(newStatus, result.lastInsertRowid);
    }, 2000);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages/:id/retry', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE messages SET status = ? WHERE id = ?').run('sending', id);

    setTimeout(() => {
      db.prepare('UPDATE messages SET status = ? WHERE id = ?').run('sent', id);
    }, 1500);

    const message = db.prepare(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.status,
        m.created_at,
        u.name as sender_name,
        u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(id);

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/conversations/:id/pin', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { id } = req.params;
    const { is_pinned } = req.body;
    
    const result = db.prepare('UPDATE conversation_members SET is_pinned = ? WHERE conversation_id = ? AND user_id = ?').run(is_pinned ? 1 : 0, id, userId);
    
    if (result.changes === 0) {
      db.prepare('INSERT INTO conversation_members (conversation_id, user_id, is_pinned, unread_count) VALUES (?, ?, ?, 0)').run(id, userId, is_pinned ? 1 : 0);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/conversations/:id/mute', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { id } = req.params;
    const { is_muted } = req.body;
    
    const result = db.prepare('UPDATE conversation_members SET is_muted = ? WHERE conversation_id = ? AND user_id = ?').run(is_muted ? 1 : 0, id, userId);
    
    if (result.changes === 0) {
      db.prepare('INSERT INTO conversation_members (conversation_id, user_id, is_muted, unread_count) VALUES (?, ?, ?, 0)').run(id, userId, is_muted ? 1 : 0);
    }
    
    res.json({ success: true, is_muted: is_muted ? 1 : 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/drafts', (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { conversation_id, content } = req.body;
    
    if (content?.trim()) {
      db.prepare(`
        INSERT OR REPLACE INTO drafts (conversation_id, user_id, content, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(conversation_id, userId, content.trim(), new Date().toISOString());
    } else {
      db.prepare('DELETE FROM drafts WHERE conversation_id = ? AND user_id = ?').run(conversation_id, userId);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running at http://127.0.0.1:${PORT}`);
});
