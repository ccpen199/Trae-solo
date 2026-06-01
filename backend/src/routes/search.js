const express = require('express');
const db = require('../database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const hotKeywords = ['NBA', '湖人', '詹姆斯', 'C罗', '梅西', '欧冠', 'CBA', 'S14', 'LPL', '羽毛球'];

router.get('/', optionalAuth, (req, res) => {
  const { keyword, type = 'all', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  if (!keyword) {
    return res.json({ 
      hot_keywords: hotKeywords,
      history: []
    });
  }

  if (req.user) {
    const existingHistory = db.prepare('SELECT id FROM search_history WHERE user_id = ? AND keyword = ?').get(req.user.id, keyword);
    if (existingHistory) {
      db.prepare('UPDATE search_history SET search_count = search_count + 1, last_searched_at = CURRENT_TIMESTAMP WHERE id = ?').run(existingHistory.id);
    } else {
      db.prepare('INSERT INTO search_history (user_id, keyword) VALUES (?, ?)').run(req.user.id, keyword);
    }
  }

  let results = {};
  const searchPattern = `%${keyword}%`;

  if (type === 'all' || type === 'posts') {
    const posts = db.prepare(`
      SELECT p.id, p.title, p.type, p.created_at, u.nickname as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.title LIKE ? OR p.content LIKE ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(searchPattern, searchPattern, limit, offset);
    results.posts = posts;
  }

  if (type === 'all' || type === 'users') {
    const users = db.prepare(`
      SELECT id, username, nickname, level, reputation
      FROM users
      WHERE username LIKE ? OR nickname LIKE ?
      ORDER BY level DESC, reputation DESC
      LIMIT 10
    `).all(searchPattern, searchPattern);
    results.users = users;
  }

  const suggestions = hotKeywords.filter(k => k.includes(keyword) || keyword.includes(k)).slice(0, 5);

  let history = [];
  if (req.user) {
    history = db.prepare(`
      SELECT keyword, MAX(last_searched_at) as last_searched_at
      FROM search_history
      WHERE user_id = ?
      GROUP BY keyword
      ORDER BY last_searched_at DESC
      LIMIT 10
    `).all(req.user.id);
  }

  res.json({ results, suggestions, history, hot_keywords: hotKeywords });
});

router.delete('/history', optionalAuth, (req, res) => {
  if (req.user) {
    db.prepare('DELETE FROM search_history WHERE user_id = ?').run(req.user.id);
  }
  res.json({ success: true });
});

module.exports = router;
