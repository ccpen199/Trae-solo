const db = require('../database');

const getComments = (req, res) => {
  try {
    const { guide_id, travel_bar_id } = req.query;

    let query = `
      SELECT c.*, u.username as author_name, u.avatar as author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.parent_id IS NULL
    `;
    let params = [];

    if (guide_id) {
      query += ' AND c.guide_id = ?';
      params.push(guide_id);
    } else if (travel_bar_id) {
      query += ' AND c.travel_bar_id = ?';
      params.push(travel_bar_id);
    }

    query += ' ORDER BY c.created_at DESC';

    const comments = db.prepare(query).all(...params);

    for (let comment of comments) {
      const replies = db.prepare(`
        SELECT r.*, u.username as author_name, u.avatar as author_avatar
        FROM comments r
        JOIN users u ON r.user_id = u.id
        WHERE r.parent_id = ?
        ORDER BY r.created_at
      `).all(comment.id);
      comment.replies = replies;
    }

    res.json(comments);
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const createComment = (req, res) => {
  try {
    const { guide_id, travel_bar_id, parent_id, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: '请输入评论内容' });
    }

    const result = db.prepare(`
      INSERT INTO comments (user_id, guide_id, travel_bar_id, parent_id, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.userId, guide_id || null, travel_bar_id || null, parent_id || null, content);

    res.status(201).json({ id: result.lastInsertRowid, message: '评论发布成功' });
  } catch (error) {
    console.error('创建评论错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = { getComments, createComment };
