const db = require('../config/database');
const { success, fail } = require('../utils/response');

const userController = {
  getProfile: (req, res) => {
    try {
      const { id } = req.params;
      
      const user = db.prepare('SELECT id, username, nickname, avatar, bio, role, created_at FROM users WHERE id = ?').get(id);
      if (!user) {
        return res.status(404).json(fail('用户不存在'));
      }

      const followerCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(id).count;
      const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(id).count;
      const questionCount = db.prepare("SELECT COUNT(*) as count FROM questions WHERE user_id = ? AND status = 'published'").get(id).count;
      const answerCount = db.prepare('SELECT COUNT(*) as count FROM answers WHERE user_id = ?').get(id).count;
      const articleCount = db.prepare("SELECT COUNT(*) as count FROM articles WHERE user_id = ? AND status = 'published'").get(id).count;

      let is_following = false;
      if (req.user && req.user.id !== parseInt(id)) {
        const follow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, id);
        is_following = !!follow;
      }

      res.json(success({
        ...user,
        follower_count: followerCount,
        following_count: followingCount,
        question_count: questionCount,
        answer_count: answerCount,
        article_count: articleCount,
        is_following
      }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取用户信息失败'));
    }
  },

  getMyQuestions: (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const questions = db.prepare(`
        SELECT q.*, t.name as topic_name
        FROM questions q
        LEFT JOIN topics t ON q.topic_id = t.id
        WHERE q.user_id = ?
        ORDER BY q.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, parseInt(limit), offset);

      const total = db.prepare('SELECT COUNT(*) as count FROM questions WHERE user_id = ?').get(req.user.id).count;

      res.json(success({ list: questions, total, page: parseInt(page) }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取失败'));
    }
  },

  getMyAnswers: (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const answers = db.prepare(`
        SELECT a.*, q.title as question_title, q.id as question_id
        FROM answers a
        LEFT JOIN questions q ON a.question_id = q.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, parseInt(limit), offset);

      const total = db.prepare('SELECT COUNT(*) as count FROM answers WHERE user_id = ?').get(req.user.id).count;

      res.json(success({ list: answers, total, page: parseInt(page) }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取失败'));
    }
  },

  getMyArticles: (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const articles = db.prepare(`
        SELECT a.*, t.name as topic_name
        FROM articles a
        LEFT JOIN topics t ON a.topic_id = t.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, parseInt(limit), offset);

      const total = db.prepare('SELECT COUNT(*) as count FROM articles WHERE user_id = ?').get(req.user.id).count;

      res.json(success({ list: articles, total, page: parseInt(page) }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取失败'));
    }
  },

  getMyFavorites: (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const favorites = db.prepare(`
        SELECT f.*, 
          CASE 
            WHEN f.target_type = 'article' THEN a.title
          END as title,
          CASE 
            WHEN f.target_type = 'article' THEN a.excerpt
          END as excerpt
        FROM favorites f
        LEFT JOIN articles a ON f.target_type = 'article' AND f.target_id = a.id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, parseInt(limit), offset);

      const total = db.prepare('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?').get(req.user.id).count;

      res.json(success({ list: favorites, total, page: parseInt(page) }));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取失败'));
    }
  },

  getMyFollowings: (req, res) => {
    try {
      const followings = db.prepare(`
        SELECT f.following_id as id, u.nickname, u.avatar, u.bio
        FROM follows f
        LEFT JOIN users u ON f.following_id = u.id
        WHERE f.follower_id = ?
        ORDER BY f.created_at DESC
      `).all(req.user.id);

      res.json(success(followings));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取失败'));
    }
  },

  getMyFollowers: (req, res) => {
    try {
      const followers = db.prepare(`
        SELECT f.follower_id as id, u.nickname, u.avatar, u.bio
        FROM follows f
        LEFT JOIN users u ON f.follower_id = u.id
        WHERE f.following_id = ?
        ORDER BY f.created_at DESC
      `).all(req.user.id);

      res.json(success(followers));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取失败'));
    }
  },

  toggleFollowUser: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (userId === parseInt(id)) {
        return res.status(400).json(fail('不能关注自己'));
      }

      const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(userId, id);

      if (existing) {
        db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(userId, id);
        res.json(success({ followed: false }, '已取消关注'));
      } else {
        db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(userId, id);
        res.json(success({ followed: true }, '已关注'));
      }
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('操作失败'));
    }
  }
};

module.exports = userController;
