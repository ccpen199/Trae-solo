const express = require('express');
const { db } = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const users = await db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const questions = await db.prepare('SELECT COUNT(*) as count FROM questions WHERE status = 1').get().count;
    const articles = await db.prepare('SELECT COUNT(*) as count FROM articles WHERE status = 1').get().count;
    const answers = await db.prepare('SELECT COUNT(*) as count FROM answers WHERE status = 1').get().count;
    const comments = await db.prepare('SELECT COUNT(*) as count FROM comments WHERE status = 1').get().count;
    const reports = await db.prepare('SELECT COUNT(*) as count FROM reports WHERE status = 0').get().count;

    res.json({
      success: true,
      data: {
        users,
        questions,
        articles,
        answers,
        comments,
        reports
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    let whereClause = '1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR nickname LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (status !== undefined && status !== '') {
      whereClause += ' AND status = ?';
      params.push(Number(status));
    }

    const countSql = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
    const totalResult = await db.prepare(countSql).get(...params);
    const total = totalResult.total;

    const sql = `
      SELECT id, username, email, phone, nickname, avatar, bio, role, status, created_at, updated_at
      FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const users = await db.prepare(sql).all(...params, limit, offset);

    res.json({
      success: true,
      data: {
        list: users,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.role === 'admin' && req.user.id !== Number(id)) {
      return res.status(403).json({
        success: false,
        message: '不能操作其他管理员账号'
      });
    }

    await db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(Number(status), Date.now(), id);

    res.json({
      success: true,
      message: '操作成功'
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    let whereClause = '1=1';
    const params = [];

    if (status !== undefined && status !== '') {
      whereClause += ' AND r.status = ?';
      params.push(Number(status));
    }

    const countSql = `SELECT COUNT(*) as total FROM reports r WHERE ${whereClause}`;
    const totalResult = await db.prepare(countSql).get(...params);
    const total = totalResult.total;

    const sql = `
      SELECT r.*, 
             u.nickname as reporter_name, u.avatar as reporter_avatar
      FROM reports r
      LEFT JOIN users u ON r.reporter_id = u.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const reports = await db.prepare(sql).all(...params, limit, offset);

    res.json({
      success: true,
      data: {
        list: reports,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: '获取举报列表失败'
    });
  }
});

router.put('/reports/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: '举报记录不存在'
      });
    }

    await db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(Number(status), id);

    res.json({
      success: true,
      message: '操作成功'
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

router.put('/content/:targetType/:targetId/status', async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { status } = req.body;

    if (!['question', 'article', 'answer', 'comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: '无效的内容类型'
      });
    }

    const tableMap = {
      question: 'questions',
      article: 'articles',
      answer: 'answers',
      comment: 'comments'
    };

    const table = tableMap[targetType];
    await db.prepare(`UPDATE ${table} SET status = ?, updated_at = ? WHERE id = ?`).run(Number(status), Date.now(), targetId);

    res.json({
      success: true,
      message: '操作成功'
    });
  } catch (error) {
    console.error('Update content status error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

router.put('/recommendations/:targetType/:targetId', async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { isRecommended, sortWeight = 0 } = req.body;

    if (!['question', 'article'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: '无效的内容类型'
      });
    }

    const tableMap = {
      question: 'questions',
      article: 'articles'
    };

    const table = tableMap[targetType];
    await db.prepare(`UPDATE ${table} SET is_recommended = ?, sort_weight = ?, updated_at = ? WHERE id = ?`)
      .run(Number(isRecommended), sortWeight, Date.now(), targetId);

    res.json({
      success: true,
      message: '操作成功'
    });
  } catch (error) {
    console.error('Set recommendation error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

module.exports = router;
