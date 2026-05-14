const express = require('express');
const db = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  try {
    const { page = 1, limit = 20, topic } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT q.*, u.nickname, u.avatar
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
    `;
    
    const params = [];
    if (topic) {
      query += ` LEFT JOIN question_topics qt ON q.id = qt.question_id WHERE qt.topic_id = ?`;
      params.push(topic);
    }
    
    query += ` GROUP BY q.id ORDER BY q.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const questions = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as total FROM questions').get().total;

    questions.forEach(q => {
      const topics = db.prepare(`
        SELECT t.id, t.name FROM topics t
        JOIN question_topics qt ON t.id = qt.topic_id
        WHERE qt.question_id = ?
      `).all(q.id);
      q.topics = topics.map(t => t.name);
      q.topic_ids = topics.map(t => t.id);
    });

    res.json({
      success: true,
      data: {
        list: questions,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取问题列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;

    const question = db.prepare(`
      SELECT q.*, u.nickname, u.avatar, u.bio as user_bio
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.id = ?
    `).get(id);

    if (!question) {
      return res.status(404).json({ success: false, message: '问题不存在' });
    }

    db.prepare('UPDATE questions SET view_count = view_count + 1 WHERE id = ?').run(id);

    const topics = db.prepare(`
      SELECT t.id, t.name FROM topics t
      JOIN question_topics qt ON t.id = qt.topic_id
      WHERE qt.question_id = ?
    `).all(id);

    question.topics = topics.map(t => t.name);
    question.topic_ids = topics.map(t => t.id);

    res.json({ success: true, data: question });
  } catch (error) {
    console.error('获取问题详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', authenticateToken, [
  body('title').isLength({ min: 1, max: 50 }),
  body('content').isLength({ max: 3000 }),
  body('topic_ids').isArray({ min: 1, max: 5 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { title, content, topic_ids } = req.body;

    if (!title.endsWith('？') && !title.endsWith('?')) {
      return res.status(400).json({ success: false, message: '问题标题必须以问号结尾' });
    }

    const insertQuestion = db.prepare('INSERT INTO questions (user_id, title, content) VALUES (?, ?, ?)');
    const result = insertQuestion.run(req.user.userId, title, content);
    const questionId = result.lastInsertRowid;

    const insertTopic = db.prepare('INSERT INTO question_topics (question_id, topic_id) VALUES (?, ?)');
    topic_ids.forEach(topicId => {
      insertTopic.run(questionId, topicId);
    });

    res.json({ success: true, data: { id: questionId }, message: '问题发布成功' });
  } catch (error) {
    console.error('创建问题错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id/similar', (req, res) => {
  try {
    const { id } = req.params;
    
    const question = db.prepare('SELECT title FROM questions WHERE id = ?').get(id);
    if (!question) {
      return res.json({ success: true, data: [] });
    }

    const keywords = question.title.replace(/[？?]/g, '').split(/\s+/).slice(0, 3);
    const likeConditions = keywords.map(() => 'title LIKE ?').join(' OR ');
    const params = keywords.map(k => `%${k}%`);

    const similar = db.prepare(`
      SELECT id, title, answer_count
      FROM questions
      WHERE id != ? AND (${likeConditions})
      ORDER BY created_at DESC LIMIT 5
    `).all(id, ...params);

    res.json({ success: true, data: similar || [] });
  } catch (error) {
    console.error('获取相似问题错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
