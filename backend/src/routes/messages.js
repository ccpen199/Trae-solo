const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

function filterSensitive(content) {
  let filtered = content;
  filtered = filtered.replace(/1[3-9]\d{9}/g, '[phone hidden]');
  filtered = filtered.replace(/微信[：:]?\s*\S+/gi, '[wechat hidden]');
  filtered = filtered.replace(/weixin[：:]?\s*\S+/gi, '[wechat hidden]');
  filtered = filtered.replace(/wx[：:]?\s*\S+/gi, '[wechat hidden]');
  return filtered;
}

router.get('/sessions', auth, (req, res) => {
  try {
    const sessions = db.prepare(
      `SELECT ms.*, j.title as job_title, uw.username as worker_name, ue.username as employer_name
       FROM message_sessions ms
       LEFT JOIN jobs j ON ms.job_id = j.id
       LEFT JOIN users uw ON ms.worker_id = uw.id
       LEFT JOIN users ue ON ms.employer_id = ue.id
       WHERE ms.worker_id = ? OR ms.employer_id = ?
       ORDER BY ms.updated_at DESC`
    ).all(req.user.id, req.user.id);

    const result = sessions.map(s => {
      const unread = db.prepare(
        'SELECT COUNT(*) as count FROM messages WHERE session_id = ? AND receiver_id = ? AND is_read = 0'
      ).get(s.id, req.user.id);
      return { ...s, unread_count: unread.count };
    });

    res.json({ code: 0, data: result, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

function createSession(req, res) {
  try {
    const { job_id } = req.body;
    let { counterpart_id } = req.body;
    if (!job_id) {
      return res.status(400).json({ code: -1, message: 'Job ID is required' });
    }
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job_id);
    if (!job) {
      return res.status(404).json({ code: -1, message: 'Job not found' });
    }

    let workerId, employerId;
    if (req.user.role === 'worker') {
      workerId = req.user.id;
      employerId = counterpart_id || job.employer_id;
    } else {
      if (!counterpart_id) {
        const recentOrder = db.prepare(
          'SELECT worker_id FROM orders WHERE job_id = ? ORDER BY created_at DESC LIMIT 1'
        ).get(job_id);
        counterpart_id = recentOrder?.worker_id;
      }
      if (!counterpart_id) {
        return res.status(400).json({ code: -1, message: 'Counterpart ID is required' });
      }
      workerId = counterpart_id;
      employerId = req.user.id;
    }

    let session = db.prepare(
      'SELECT * FROM message_sessions WHERE job_id = ? AND worker_id = ? AND employer_id = ?'
    ).get(job_id, workerId, employerId);

    if (!session) {
      const result = db.prepare(
        'INSERT INTO message_sessions (job_id, worker_id, employer_id) VALUES (?, ?, ?)'
      ).run(job_id, workerId, employerId);
      session = db.prepare('SELECT * FROM message_sessions WHERE id = ?').get(result.lastInsertRowid);
    }

    res.json({ code: 0, data: session, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
}

router.post('/sessions', auth, createSession);
router.post('/', auth, createSession);

function getSession(req, res) {
  try {
    const session = db.prepare('SELECT * FROM message_sessions WHERE id = ?').get(req.params.id);
    if (!session) {
      return res.status(404).json({ code: -1, message: 'Session not found' });
    }
    if (session.worker_id !== req.user.id && session.employer_id !== req.user.id) {
      return res.status(403).json({ code: -1, message: 'Access denied' });
    }
    const messages = db.prepare(
      'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC'
    ).all(req.params.id);
    res.json({ code: 0, data: { ...session, messages }, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
}

router.get('/sessions/:id', auth, getSession);
router.get('/:id', auth, getSession);

function sendMessage(req, res) {
  try {
    const session = db.prepare('SELECT * FROM message_sessions WHERE id = ?').get(req.params.id);
    if (!session) {
      return res.status(404).json({ code: -1, message: 'Session not found' });
    }
    if (session.worker_id !== req.user.id && session.employer_id !== req.user.id) {
      return res.status(403).json({ code: -1, message: 'Access denied' });
    }
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ code: -1, message: 'Content is required' });
    }
    const filteredContent = filterSensitive(content);
    const receiverId = req.user.id === session.worker_id ? session.employer_id : session.worker_id;
    const result = db.prepare(
      'INSERT INTO messages (session_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)'
    ).run(req.params.id, req.user.id, receiverId, filteredContent);
    db.prepare(
      'UPDATE message_sessions SET last_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(filteredContent, req.params.id);
    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
}

router.post('/sessions/:id/messages', auth, sendMessage);
router.post('/:id', auth, sendMessage);

router.put('/sessions/:id/read', auth, (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM message_sessions WHERE id = ?').get(req.params.id);
    if (!session) {
      return res.status(404).json({ code: -1, message: 'Session not found' });
    }
    db.prepare(
      'UPDATE messages SET is_read = 1 WHERE session_id = ? AND receiver_id = ? AND is_read = 0'
    ).run(req.params.id, req.user.id);
    res.json({ code: 0, data: null, message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

module.exports = router;
