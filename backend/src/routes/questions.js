const express = require('express');
const { body, validationResult } = require('express-validator');
const { runQuery, runGet, runRun } = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type = 'hot', category, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT q.*, u.nickname, u.avatar
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM questions WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND q.category = ?';
      countQuery += ' AND category = ?';
      params.push(category);
    }

    if (type === 'hot') {
      query += ' ORDER BY q.agree_count DESC, q.view_count DESC';
    } else {
      query += ' ORDER BY q.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const questions = await runQuery(query, params);
    const { total } = await runGet(countQuery, params.slice(0, params.length - 2));

    res.json({
      success: true,
      data: {
        list: questions,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/categories', (req, res) => {
  try {
    const categories = ['健康', '饲养', '行为', '训练', '美容', '其他'];
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const question = await runGet(`
      SELECT q.*, u.nickname, u.avatar
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.id = ?
    `, [req.params.id]);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    await runRun('UPDATE questions SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);

    if (req.user) {
      const vote = await runGet('SELECT vote_type FROM question_votes WHERE question_id = ? AND user_id = ?', [req.params.id, req.user.id]);
      question.my_vote = vote?.vote_type || 0;

      const favorited = await runGet('SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?', [req.user.id, 'question', question.id]);
      question.is_favorited = !!favorited;
    }

    const answers = await runQuery(`
      SELECT a.*, u.nickname, u.avatar
      FROM answers a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.question_id = ?
      ORDER BY a.agree_count DESC
      LIMIT 10
    `, [req.params.id]);

    question.answers = answers;

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Get question detail error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/', authMiddleware, [
  body('title').notEmpty().withMessage('标题不能为空'),
  body('content').notEmpty().withMessage('内容不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { title, content, category } = req.body;

    const result = await runRun(`
      INSERT INTO questions (user_id, title, content, category)
      VALUES (?, ?, ?, ?)
    `, [req.user.id, title, content, category || '其他']);

    const question = await runGet('SELECT * FROM questions WHERE id = ?', [result.lastID]);

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { vote_type } = req.body;
    const questionId = req.params.id;
    const userId = req.user.id;

    if (![-1, 1].includes(vote_type)) {
      return res.status(400).json({
        success: false,
        message: '无效的投票类型'
      });
    }

    const existing = await runGet('SELECT id, vote_type FROM question_votes WHERE question_id = ? AND user_id = ?', [questionId, userId]);

    if (existing) {
      if (existing.vote_type === vote_type) {
        await runRun('DELETE FROM question_votes WHERE id = ?', [existing.id]);
        if (vote_type === 1) {
          await runRun('UPDATE questions SET agree_count = agree_count - 1 WHERE id = ?', [questionId]);
        } else {
          await runRun('UPDATE questions SET disagree_count = disagree_count - 1 WHERE id = ?', [questionId]);
        }
        res.json({ success: true, data: { vote_type: 0 } });
      } else {
        await runRun('UPDATE question_votes SET vote_type = ? WHERE id = ?', [vote_type, existing.id]);
        if (vote_type === 1) {
          await runRun('UPDATE questions SET agree_count = agree_count + 1, disagree_count = disagree_count - 1 WHERE id = ?', [questionId]);
        } else {
          await runRun('UPDATE questions SET agree_count = agree_count - 1, disagree_count = disagree_count + 1 WHERE id = ?', [questionId]);
        }
        res.json({ success: true, data: { vote_type } });
      }
    } else {
      await runRun('INSERT INTO question_votes (question_id, user_id, vote_type) VALUES (?, ?, ?)', [questionId, userId, vote_type]);
      if (vote_type === 1) {
        await runRun('UPDATE questions SET agree_count = agree_count + 1 WHERE id = ?', [questionId]);
      } else {
        await runRun('UPDATE questions SET disagree_count = disagree_count + 1 WHERE id = ?', [questionId]);
      }
      res.json({ success: true, data: { vote_type } });
    }
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user.id;

    const existing = await runGet('SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?', [userId, 'question', questionId]);

    if (existing) {
      await runRun('DELETE FROM favorites WHERE id = ?', [existing.id]);
      res.json({ success: true, data: { favorited: false } });
    } else {
      await runRun('INSERT INTO favorites (user_id, target_type, target_id) VALUES (?, ?, ?)', [userId, 'question', questionId]);
      res.json({ success: true, data: { favorited: true } });
    }
  } catch (error) {
    console.error('Favorite error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
