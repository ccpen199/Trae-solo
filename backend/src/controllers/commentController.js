const db = require('../config/database');
const { success, fail } = require('../utils/response');

const commentController = {
  create: (req, res) => {
    try {
      const { target_type, target_id, content } = req.body;
      
      if (!target_type || !target_id || !content) {
        return res.status(400).json(fail('参数不完整'));
      }

      const stmt = db.prepare(`
        INSERT INTO comments (target_type, target_id, user_id, content)
        VALUES (?, ?, ?, ?)
      `);
      const result = stmt.run(target_type, target_id, req.user.id, content);

      if (target_type === 'article') {
        db.prepare('UPDATE articles SET comment_count = comment_count + 1 WHERE id = ?').run(target_id);
      }

      const comment = db.prepare(`
        SELECT c.*, u.nickname, u.avatar
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `).get(result.lastInsertRowid);

      res.json(success(comment, '评论成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('评论失败'));
    }
  },

  like: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?').get(userId, 'comment', id);

      if (existing) {
        db.prepare('DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?').run(userId, 'comment', id);
        db.prepare('UPDATE comments SET like_count = like_count - 1 WHERE id = ?').run(id);
        res.json(success({ liked: false }));
      } else {
        db.prepare('INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)').run(userId, 'comment', id);
        db.prepare('UPDATE comments SET like_count = like_count + 1 WHERE id = ?').run(id);
        res.json(success({ liked: true }));
      }
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('操作失败'));
    }
  }
};

module.exports = commentController;
