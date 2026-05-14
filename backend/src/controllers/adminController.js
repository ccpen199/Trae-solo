const db = require('../config/database');
const { success, fail } = require('../utils/response');

const adminController = {
  getDashboardStats: (req, res) => {
    try {
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      const questionCount = db.prepare('SELECT COUNT(*) as count FROM questions').get().count;
      const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles').get().count;
      const answerCount = db.prepare('SELECT COUNT(*) as count FROM answers').get().count;
      const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments').get().count;

      res.json(success({
        user_count: userCount,
        question_count: questionCount,
        article_count: articleCount,
        answer_count: answerCount,
        comment_count: commentCount
      }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取统计失败'));
    }
  },

  getUsers: (req, res) => {
    try {
      const { page = 1, limit = 20, status, role } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      if (role) {
        whereClause += ' AND role = ?';
        params.push(role);
      }

      const users = db.prepare(`
        SELECT id, username, email, nickname, avatar, bio, role, status, created_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, parseInt(limit), offset);

      const total = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params).count;

      res.json(success({ list: users, total, page: parseInt(page) }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取用户列表失败'));
    }
  },

  updateUserRole: (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['user', 'editor', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json(fail('无效的角色'));
      }

      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
      res.json(success(null, '角色更新成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('更新失败'));
    }
  },

  toggleUserStatus: (req, res) => {
    try {
      const { id } = req.params;
      
      const user = db.prepare('SELECT id, status FROM users WHERE id = ?').get(id);
      if (!user) {
        return res.status(404).json(fail('用户不存在'));
      }

      const newStatus = user.status === 'active' ? 'disabled' : 'active';
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus, id);

      res.json(success({ status: newStatus }, '状态更新成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('操作失败'));
    }
  },

  getContentList: (req, res) => {
    try {
      const { type = 'all', page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      let results = [];
      let total = 0;

      if (type === 'all' || type === 'questions') {
        let qWhere = 'WHERE 1=1';
        const qParams = [];
        if (status) {
          qWhere += ' AND status = ?';
          qParams.push(status);
        }
        const questions = db.prepare(`
          SELECT q.*, u.nickname, 'question' as content_type
          FROM questions q
          LEFT JOIN users u ON q.user_id = u.id
          ${qWhere}
          ORDER BY q.created_at DESC
          LIMIT ? OFFSET ?
        `).all(...qParams, parseInt(limit), offset);
        results = [...results, ...questions];
        const qTotal = db.prepare(`SELECT COUNT(*) as count FROM questions ${qWhere}`).get(...qParams).count;
        total += qTotal;
      }

      if (type === 'all' || type === 'articles') {
        let aWhere = 'WHERE 1=1';
        const aParams = [];
        if (status) {
          aWhere += ' AND status = ?';
          aParams.push(status);
        }
        const articles = db.prepare(`
          SELECT a.*, u.nickname, 'article' as content_type
          FROM articles a
          LEFT JOIN users u ON a.user_id = u.id
          ${aWhere}
          ORDER BY a.created_at DESC
          LIMIT ? OFFSET ?
        `).all(...aParams, parseInt(limit), offset);
        results = [...results, ...articles];
        const aTotal = db.prepare(`SELECT COUNT(*) as count FROM articles ${aWhere}`).get(...aParams).count;
        total += aTotal;
      }

      res.json(success({ list: results, total, page: parseInt(page) }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取内容列表失败'));
    }
  },

  updateContentStatus: (req, res) => {
    try {
      const { type, id } = req.params;
      const { status } = req.body;

      if (!['published', 'hidden', 'deleted'].includes(status)) {
        return res.status(400).json(fail('无效的状态'));
      }

      if (type === 'question') {
        db.prepare('UPDATE questions SET status = ? WHERE id = ?').run(status, id);
      } else if (type === 'article') {
        db.prepare('UPDATE articles SET status = ? WHERE id = ?').run(status, id);
      } else {
        return res.status(400).json(fail('无效的内容类型'));
      }

      res.json(success(null, '状态更新成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('操作失败'));
    }
  },

  deleteContent: (req, res) => {
    try {
      const { type, id } = req.params;

      if (type === 'question') {
        db.prepare('DELETE FROM questions WHERE id = ?').run(id);
      } else if (type === 'article') {
        db.prepare('DELETE FROM articles WHERE id = ?').run(id);
      } else if (type === 'answer') {
        db.prepare('DELETE FROM answers WHERE id = ?').run(id);
      } else if (type === 'comment') {
        db.prepare('DELETE FROM comments WHERE id = ?').run(id);
      } else {
        return res.status(400).json(fail('无效的内容类型'));
      }

      res.json(success(null, '删除成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('删除失败'));
    }
  }
};

module.exports = adminController;
