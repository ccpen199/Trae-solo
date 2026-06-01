const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

router.get('/bookshelf', authMiddleware, (req, res) => {
  const db = req.db;
  const items = db.prepare(`
    SELECT b.*, n.title, n.cover_image, n.author_id, u.nickname as author_name,
           c.title as last_chapter_title, b.last_read_time
    FROM bookshelves b
    LEFT JOIN novels n ON b.novel_id = n.id
    LEFT JOIN users u ON n.author_id = u.id
    LEFT JOIN chapters c ON b.last_read_chapter_id = c.id
    WHERE b.user_id = ? ORDER BY b.last_read_time DESC
  `).all(req.user.id);
  res.json(items);
});

router.post('/bookshelf', authMiddleware, (req, res) => {
  const db = req.db;
  const { novel_id } = req.body;
  
  const exists = db.prepare('SELECT id FROM bookshelves WHERE user_id = ? AND novel_id = ?').get(req.user.id, novel_id);
  if (exists) {
    db.prepare('DELETE FROM bookshelves WHERE id = ?').run(exists.id);
    return res.json({ message: '已移除书架', added: false });
  }
  
  db.prepare('INSERT INTO bookshelves (user_id, novel_id) VALUES (?, ?)').run(req.user.id, novel_id);
  res.json({ message: '已加入书架', added: true });
});

router.post('/subscribe', authMiddleware, (req, res) => {
  const db = req.db;
  const { novel_id, chapter_id, amount, type = 'chapter' } = req.body;
  
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  if (user.balance < amount) {
    return res.status(400).json({ error: '余额不足' });
  }
  
  const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6);
  
  db.prepare('BEGIN').run();
  try {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);
    
    db.prepare(`
      INSERT INTO subscriptions (user_id, novel_id, chapter_id, type, amount, status)
      VALUES (?, ?, ?, ?, ?, 'success')
    `).run(req.user.id, novel_id, chapter_id, type, amount);
    
    db.prepare(`
      INSERT INTO orders (order_no, user_id, novel_id, chapter_id, type, amount, status, pay_time)
      VALUES (?, ?, ?, ?, ?, ?, 'success', CURRENT_TIMESTAMP)
    `).run(orderNo, req.user.id, novel_id, chapter_id, type, amount);
    
    db.prepare('UPDATE novels SET subscribe_count = subscribe_count + 1 WHERE id = ?').run(novel_id);
    
    db.prepare('COMMIT').run();
    res.json({ message: '订阅成功', order_no: orderNo });
  } catch (e) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: '订阅失败' });
  }
});

router.get('/subscriptions', authMiddleware, (req, res) => {
  const db = req.db;
  const subs = db.prepare(`
    SELECT s.*, n.title as novel_title, c.title as chapter_title
    FROM subscriptions s
    LEFT JOIN novels n ON s.novel_id = n.id
    LEFT JOIN chapters c ON s.chapter_id = c.id
    WHERE s.user_id = ? ORDER BY s.id DESC
  `).all(req.user.id);
  res.json(subs);
});

router.post('/comment', authMiddleware, (req, res) => {
  const db = req.db;
  const { novel_id, chapter_id, content, parent_id } = req.body;
  
  db.prepare(`
    INSERT INTO comments (user_id, novel_id, chapter_id, content, parent_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, novel_id, chapter_id, content, parent_id);
  
  res.json({ message: '评论成功' });
});

router.get('/comments/novel/:novelId', (req, res) => {
  const db = req.db;
  const comments = db.prepare(`
    SELECT c.*, u.nickname as user_name, u.avatar as user_avatar
    FROM comments c LEFT JOIN users u ON c.user_id = u.id
    WHERE c.novel_id = ? AND c.status = 'active' ORDER BY c.id DESC
  `).all(req.params.novelId);
  res.json(comments);
});

router.post('/reward', authMiddleware, (req, res) => {
  const db = req.db;
  const { novel_id, amount, message } = req.body;
  
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  if (user.balance < amount) {
    return res.status(400).json({ error: '余额不足' });
  }
  
  db.prepare('BEGIN').run();
  try {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);
    db.prepare('INSERT INTO rewards (user_id, novel_id, amount, message) VALUES (?, ?, ?, ?)').run(req.user.id, novel_id, amount, message);
    db.prepare('COMMIT').run();
    res.json({ message: '打赏成功' });
  } catch (e) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: '打赏失败' });
  }
});

router.post('/vote', authMiddleware, (req, res) => {
  const db = req.db;
  const { novel_id, vote_type = 'monthly' } = req.body;
  
  try {
    db.prepare('INSERT OR IGNORE INTO votes (user_id, novel_id, vote_type) VALUES (?, ?, ?)').run(req.user.id, novel_id, vote_type);
    db.prepare('UPDATE novels SET vote_count = vote_count + 1 WHERE id = ?').run(novel_id);
    res.json({ message: '投票成功' });
  } catch (e) {
    res.status(400).json({ error: '已经投过票了' });
  }
});

router.post('/reading-progress', authMiddleware, (req, res) => {
  const db = req.db;
  const { novel_id, chapter_id, progress } = req.body;
  
  db.prepare(`
    INSERT INTO reading_progress (user_id, novel_id, chapter_id, progress)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, novel_id) DO UPDATE SET chapter_id = ?, progress = ?, updated_at = CURRENT_TIMESTAMP
  `).run(req.user.id, novel_id, chapter_id, progress, chapter_id, progress);
  
  db.prepare(`
    UPDATE bookshelves SET last_read_chapter_id = ?, last_read_time = CURRENT_TIMESTAMP
    WHERE user_id = ? AND novel_id = ?
  `).run(chapter_id, req.user.id, novel_id);
  
  res.json({ message: '进度已保存' });
});

router.get('/reading-progress/:novelId', authMiddleware, (req, res) => {
  const db = req.db;
  const progress = db.prepare('SELECT * FROM reading_progress WHERE user_id = ? AND novel_id = ?').get(req.user.id, req.params.novelId);
  res.json(progress || { progress: 0, chapter_id: null });
});

module.exports = router;
