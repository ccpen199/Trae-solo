const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/init');
const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const { planet_id, page = 1, pageSize = 20, keyword, topic_type } = req.query;
    const offset = (page - 1) * pageSize;

    if (!planet_id) {
      return res.json({ success: false, message: '缺少星球ID' });
    }

    let query = `
      SELECT t.*, u.nickname as user_name, u.avatar as user_avatar
      FROM topics t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.planet_id = ? AND t.status = 'active'
    `;
    let params = [planet_id];

    if (keyword) {
      query += ' AND (t.title LIKE ? OR t.content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (topic_type) {
      query += ' AND t.topic_type = ?';
      params.push(topic_type);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const topics = db.prepare(query).all(...params);

    const countQuery = "SELECT COUNT(*) as total FROM topics WHERE planet_id = ? AND status = 'active'";
    const totalResult = db.prepare(countQuery).get(planet_id);

    res.json({
      success: true,
      data: {
        list: topics,
        total: totalResult?.total || 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取主题列表失败:', error);
    res.json({ success: false, message: '获取主题列表失败' });
  }
});

router.get('/search', authenticateToken, (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    if (!keyword) {
      return res.json({ success: true, data: { list: [], total: 0 } });
    }

    const topics = db.prepare(`
      SELECT t.*, p.name as planet_name, u.nickname as user_name
      FROM topics t
      LEFT JOIN planets p ON t.planet_id = p.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN planet_members pm ON p.id = pm.planet_id AND pm.user_id = ?
      WHERE t.status = 'active' AND pm.id IS NOT NULL
        AND (t.title LIKE ? OR t.content LIKE ?)
      ORDER BY t.created_at DESC LIMIT ? OFFSET ?
    `).all(req.user.id, `%${keyword}%`, `%${keyword}%`, parseInt(pageSize), offset);

    const totalResult = db.prepare(`
      SELECT COUNT(*) as total
      FROM topics t
      LEFT JOIN planets p ON t.planet_id = p.id
      LEFT JOIN planet_members pm ON p.id = pm.planet_id AND pm.user_id = ?
      WHERE t.status = 'active' AND pm.id IS NOT NULL
        AND (t.title LIKE ? OR t.content LIKE ?)
    `).get(req.user.id, `%${keyword}%`, `%${keyword}%`);

    res.json({
      success: true,
      data: {
        list: topics,
        total: totalResult?.total || 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('搜索失败:', error);
    res.json({ success: false, message: '搜索失败' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const topic = db.prepare(`
      SELECT t.*, u.nickname as user_name, u.avatar as user_avatar, p.name as planet_name
      FROM topics t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN planets p ON t.planet_id = p.id
      WHERE t.id = ? AND t.status = 'active'
    `).get(req.params.id);

    if (!topic) {
      return res.json({ success: false, message: '主题不存在' });
    }

    db.prepare('UPDATE topics SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

    res.json({ success: true, data: topic });
  } catch (error) {
    console.error('获取主题失败:', error);
    res.json({ success: false, message: '获取主题失败' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { planet_id, title, content, topic_type = 'normal', is_question = 0 } = req.body;

    if (!planet_id || !title || !content) {
      return res.json({ success: false, message: '请填写完整信息' });
    }

    const member = db.prepare("SELECT id FROM planet_members WHERE planet_id = ? AND user_id = ? AND status = 'active'").get(planet_id, req.user.id);
    if (!member) {
      return res.json({ success: false, message: '请先加入星球' });
    }

    const insertTopic = db.prepare(`
      INSERT INTO topics (planet_id, user_id, title, content, topic_type, is_question)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = insertTopic.run(planet_id, req.user.id, title, content, topic_type, is_question ? 1 : 0);

    db.prepare('UPDATE planets SET topic_count = topic_count + 1 WHERE id = ?').run(planet_id);

    res.json({
      success: true,
      message: '发布成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('发布主题失败:', error);
    res.json({ success: false, message: '发布主题失败' });
  }
});

router.get('/:id/comments', authenticateToken, (req, res) => {
  try {
    const comments = db.prepare(`
      SELECT c.*, u.nickname as user_name, u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.topic_id = ? AND c.status = 'active'
      ORDER BY c.created_at ASC
    `).all(req.params.id);

    res.json({ success: true, data: comments || [] });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.json({ success: false, message: '获取评论失败' });
  }
});

router.post('/:id/comments', authenticateToken, (req, res) => {
  try {
    const { content, parent_id, is_answer = 0 } = req.body;

    if (!content) {
      return res.json({ success: false, message: '请输入评论内容' });
    }

    const result = db.prepare('INSERT INTO comments (topic_id, user_id, content, parent_id, is_answer) VALUES (?, ?, ?, ?, ?)').run(req.params.id, req.user.id, content, parent_id || null, is_answer ? 1 : 0);

    db.prepare('UPDATE topics SET comment_count = comment_count + 1 WHERE id = ?').run(req.params.id);

    res.json({ success: true, message: '评论成功', data: { id: result.lastInsertRowid } });
  } catch (error) {
    console.error('评论失败:', error);
    res.json({ success: false, message: '评论失败' });
  }
});

module.exports = router;
