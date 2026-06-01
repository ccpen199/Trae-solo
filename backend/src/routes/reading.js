const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/bookshelf', authenticateToken, (req, res) => {
  const books = db.prepare(`
    SELECT b.* FROM books b
    JOIN user_bookshelf ub ON b.id = ub.book_id
    WHERE ub.user_id = ?
    ORDER BY ub.created_at DESC
  `).all(req.user.userId);
  res.json({ books });
});

router.get('/novels', (req, res) => {
  const { category, page = 1, limit = 20 } = req.query;
  let query = 'SELECT * FROM books WHERE type = ?';
  const params = ['novel'];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY click_count DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const books = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM books WHERE type = ?').get('novel').count;

  res.json({ books, total, page, limit });
});

router.get('/comics', (req, res) => {
  const { category, page = 1, limit = 20 } = req.query;
  let query = 'SELECT * FROM books WHERE type = ?';
  const params = ['comic'];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY click_count DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const books = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM books WHERE type = ?').get('comic').count;

  res.json({ books, total, page, limit });
});

router.get('/games', (req, res) => {
  const games = [
    { id: 1, name: '小游戏1', icon: '🎮', desc: '休闲小游戏' },
    { id: 2, name: '小游戏2', icon: '🎯', desc: '益智小游戏' },
    { id: 3, name: '小游戏3', icon: '🎲', desc: '策略小游戏' }
  ];
  res.json({ games });
});

router.get('/categories', (req, res) => {
  const categories = [
    { id: 'xuanhuan', name: '玄幻', type: 'novel' },
    { id: 'xianxia', name: '仙侠', type: 'novel' },
    { id: 'dushi', name: '都市', type: 'novel' },
    { id: 'rexie', name: '热血', type: 'comic' },
    { id: 'aiqing', name: '爱情', type: 'comic' }
  ];
  res.json({ categories });
});

router.post('/bookshelf/:bookId', authenticateToken, (req, res) => {
  const { bookId } = req.params;
  const existing = db.prepare('SELECT * FROM user_bookshelf WHERE user_id = ? AND book_id = ?').get(req.user.userId, bookId);

  if (existing) {
    return res.json({ success: true, message: '已在书架中' });
  }

  db.prepare('INSERT INTO user_bookshelf (user_id, book_id) VALUES (?, ?)').run(req.user.userId, bookId);
  res.json({ success: true });
});

module.exports = router;
