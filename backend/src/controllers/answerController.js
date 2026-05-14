const db = require('../config/database');
const { success, fail } = require('../utils/response');

const answerController = {
  create: (req, res) => {
    try {
      const { question_id, content } = req.body;
      
      if (!content) {
        return res.status(400).json(fail('回答内容不能为空'));
      }

      const stmt = db.prepare(`
        INSERT INTO answers (question_id, user_id, content)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(question_id, req.user.id, content);

      db.prepare('UPDATE questions SET answer_count = answer_count + 1 WHERE id = ?').run(question_id);

      const answer = db.prepare(`
        SELECT a.*, u.nickname, u.avatar
        FROM answers a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.id = ?
      `).get(result.lastInsertRowid);

      res.json(success(answer, '回答成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('回答失败'));
    }
  },

  like: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?').get(userId, 'answer', id);

      if (existing) {
        db.prepare('DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?').run(userId, 'answer', id);
        db.prepare('UPDATE answers SET like_count = like_count - 1 WHERE id = ?').run(id);
        res.json(success({ liked: false }));
      } else {
        db.prepare('INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)').run(userId, 'answer', id);
        db.prepare('UPDATE answers SET like_count = like_count + 1 WHERE id = ?').run(id);
        res.json(success({ liked: true }));
      }
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('操作失败'));
    }
  }
};

module.exports = answerController;
