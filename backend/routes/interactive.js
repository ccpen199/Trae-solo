const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

router.post('/consult', optionalAuth, (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: '问题不能为空' });
    }
    const db = getDb();
    const knowledge = db.prepare('SELECT * FROM consultations WHERE source = ?').all('ai');

    let bestMatch = null;
    let bestScore = 0;
    const keywords = question.replace(/[，。？！、；：""''（）【】\s]/g, ' ').split(/\s+/).filter(k => k.length > 0);

    knowledge.forEach(item => {
      let score = 0;
      keywords.forEach(kw => {
        if (item.question && item.question.includes(kw)) score += 3;
        if (item.answer && item.answer.includes(kw)) score += 2;
        if (item.ai_answer && item.ai_answer.includes(kw)) score += 1;
      });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    });

    let answer;
    let matched = false;
    if (bestMatch && bestScore > 0) {
      answer = bestMatch.ai_answer || bestMatch.answer;
      matched = true;
    } else {
      answer = '抱歉，暂时无法回答您的问题。您可以拨打12345政务服务热线咨询，或前往政务服务中心现场办理。我们正在不断完善知识库，感谢您的理解！';
    }

    const id = uuidv4();
    db.prepare('INSERT INTO consultations (id, user_id, question, answer, ai_answer, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.user ? req.user.id : null, question, answer, answer, 'ai', 'answered');

    res.json({ success: true, data: { id, question, answer, matched } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/consultations', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const total = db.prepare('SELECT COUNT(*) as cnt FROM consultations WHERE user_id = ?').get(req.user.id).cnt;
    const list = db.prepare('SELECT * FROM consultations WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(req.user.id, parseInt(pageSize), offset);
    res.json({ success: true, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/tickets', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { page = 1, pageSize = 10, status, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const conditions = ['user_id = ?'];
    const params = [req.user.id];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    const where = 'WHERE ' + conditions.join(' AND ');
    const total = db.prepare(`SELECT COUNT(*) as cnt FROM tickets ${where}`).get(...params).cnt;
    const list = db.prepare(`SELECT * FROM tickets ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, parseInt(pageSize), offset);

    res.json({ success: true, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/tickets', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { title, content, category, priority = 'normal', deadline } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: '工单标题不能为空' });
    }
    const id = uuidv4();
    db.prepare(`INSERT INTO tickets (id, user_id, title, content, category, status, priority, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, req.user.id, title, content || null, category || null, 'pending', priority, deadline || null);
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/tickets/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: '工单不存在' });
    }
    const { status, assigned_to, assigned_dept, priority } = req.body;
    if (status) {
      db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run(status, req.params.id);
    }
    if (assigned_to) {
      db.prepare('UPDATE tickets SET assigned_to = ? WHERE id = ?').run(assigned_to, req.params.id);
    }
    if (assigned_dept) {
      db.prepare('UPDATE tickets SET assigned_dept = ? WHERE id = ?').run(assigned_dept, req.params.id);
    }
    if (priority) {
      db.prepare('UPDATE tickets SET priority = ? WHERE id = ?').run(priority, req.params.id);
    }
    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/tickets/:id/reply', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: '工单不存在' });
    }
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: '回复内容不能为空' });
    }
    const isOfficial = req.user.role === 'admin' || req.user.role === 'staff' ? 1 : 0;
    const id = uuidv4();
    db.prepare('INSERT INTO ticket_replies (id, ticket_id, replier_id, replier_name, content, is_official) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, req.params.id, req.user.id, req.user.real_name || req.user.username, content, isOfficial);
    db.prepare('UPDATE tickets SET replied_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);
    if (ticket.status === 'pending' && isOfficial) {
      db.prepare("UPDATE tickets SET status = 'replied' WHERE id = ?").run(req.params.id);
    }
    const reply = db.prepare('SELECT * FROM ticket_replies WHERE id = ?').get(id);
    res.json({ success: true, data: reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/tickets/:id/replies', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const replies = db.prepare('SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json({ success: true, data: replies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
