const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { runQuery, getQuery, allQuery } = require('./database');
const { authMiddleware, validateParams } = require('./middleware');

const router = express.Router();

router.post('/auth/login', validateParams(['phone', 'password']), async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await getQuery('SELECT * FROM users WHERE phone = ?', [phone]);
    
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: '密码错误' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      success: true, 
      data: { 
        token, 
        user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar, bio: user.bio } 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/auth/register', validateParams(['phone', 'password']), async (req, res) => {
  try {
    const { phone, password, nickname } = req.body;
    const existing = await getQuery('SELECT id FROM users WHERE phone = ?', [phone]);
    
    if (existing) {
      return res.status(400).json({ success: false, message: '手机号已注册' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const result = await runQuery(
      'INSERT INTO users (phone, password, nickname, avatar) VALUES (?, ?, ?, ?)',
      [phone, hashed, nickname || `用户${phone.slice(-4)}`, '']
    );
    
    const token = jwt.sign({ userId: result.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const user = await getQuery('SELECT id, phone, nickname, avatar, bio FROM users WHERE id = ?', [result.id]);
    
    res.json({ success: true, data: { token, user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await getQuery('SELECT id, phone, nickname, avatar, bio, created_at FROM users WHERE id = ?', [req.user.id]);
    const followStats = await getQuery('SELECT COUNT(*) as following FROM follows WHERE follower_id = ?', [req.user.id]);
    const followerStats = await getQuery('SELECT COUNT(*) as followers FROM follows WHERE following_id = ?', [req.user.id]);
    const contentStats = await getQuery('SELECT COUNT(*) as contents, SUM(views) as total_views FROM contents WHERE user_id = ?', [req.user.id]);
    
    res.json({ 
      success: true, 
      data: { 
        ...user, 
        following: followStats?.following || 0, 
        followers: followerStats?.followers || 0,
        contents: contentStats?.contents || 0,
        total_views: contentStats?.total_views || 0
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/contents', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, tag, sort = 'new' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = "WHERE c.status = 'published'";
    let params = [];
    
    if (type) {
      whereClause += ' AND c.content_type = ?';
      params.push(type);
    }
    
    let orderBy = 'c.created_at DESC';
    if (sort === 'hot') orderBy = 'c.views DESC, c.likes DESC';
    if (sort === 'top') orderBy = 'c.likes DESC, c.views DESC';
    
    const contents = await allQuery(`
      SELECT c.*, u.nickname as author_name, u.avatar as author_avatar 
      FROM contents c 
      JOIN users u ON c.user_id = u.id 
      ${whereClause} 
      ORDER BY ${orderBy} 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    const total = await getQuery(`SELECT COUNT(*) as count FROM contents c ${whereClause}`, params);
    
    res.json({ success: true, data: { list: contents, total: total.count, page: parseInt(page) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/contents/:id', async (req, res) => {
  try {
    const content = await getQuery(`
      SELECT c.*, u.nickname as author_name, u.avatar as author_avatar 
      FROM contents c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.id = ?
    `, [req.params.id]);
    
    if (!content) {
      return res.status(404).json({ success: false, message: '内容不存在' });
    }
    
    await runQuery('UPDATE contents SET views = views + 1 WHERE id = ?', [req.params.id]);
    
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/contents', authMiddleware, validateParams(['title', 'content_type']), async (req, res) => {
  try {
    const { title, description, cover_url, content_url, content_type, duration, tags } = req.body;
    const result = await runQuery(
      'INSERT INTO contents (user_id, title, description, cover_url, content_url, content_type, duration, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || '', cover_url || '', content_url || '', content_type, duration || 0, tags || '']
    );
    
    res.json({ success: true, data: { id: result.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/lives', async (req, res) => {
  try {
    const lives = await allQuery(`
      SELECT l.*, u.nickname as author_name, u.avatar as author_avatar 
      FROM lives l 
      JOIN users u ON l.user_id = u.id 
      WHERE l.status = 'live' 
      ORDER BY l.viewer_count DESC 
      LIMIT 20
    `);
    
    res.json({ success: true, data: lives });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/top/creators', async (req, res) => {
  try {
    const creators = await allQuery(`
      SELECT u.id, u.nickname, u.avatar, u.bio, 
             COUNT(c.id) as content_count, 
             COALESCE(SUM(c.views), 0) as total_views,
             (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) as followers
      FROM users u 
      LEFT JOIN contents c ON u.id = c.user_id 
      GROUP BY u.id 
      ORDER BY followers DESC, total_views DESC 
      LIMIT 50
    `);
    
    res.json({ success: true, data: creators });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/follow/contents', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const contents = await allQuery(`
      SELECT c.*, u.nickname as author_name, u.avatar as author_avatar 
      FROM contents c 
      JOIN users u ON c.user_id = u.id 
      JOIN follows f ON c.user_id = f.following_id 
      WHERE f.follower_id = ? AND c.status = 'published'
      ORDER BY c.created_at DESC 
      LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), offset]);
    
    res.json({ success: true, data: { list: contents, page: parseInt(page) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/follow/:userId', authMiddleware, async (req, res) => {
  try {
    if (parseInt(req.params.userId) === req.user.id) {
      return res.status(400).json({ success: false, message: '不能关注自己' });
    }
    
    await runQuery('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)', [req.user.id, parseInt(req.params.userId)]);
    res.json({ success: true, message: '关注成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/follow/:userId', authMiddleware, async (req, res) => {
  try {
    await runQuery('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, parseInt(req.params.userId)]);
    res.json({ success: true, message: '取消关注成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/contents/:id/comments', async (req, res) => {
  try {
    const comments = await allQuery(`
      SELECT c.*, u.nickname as user_name, u.avatar as user_avatar 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.content_id = ? 
      ORDER BY c.created_at DESC
    `, [req.params.id]);
    
    res.json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/contents/:id/comments', authMiddleware, validateParams(['text']), async (req, res) => {
  try {
    await runQuery('INSERT INTO comments (content_id, user_id, text) VALUES (?, ?, ?)', [req.params.id, req.user.id, req.body.text]);
    await runQuery('UPDATE contents SET comments_count = comments_count + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '评论成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/contents/:id/danmus', async (req, res) => {
  try {
    const danmus = await allQuery('SELECT * FROM danmus WHERE content_id = ? ORDER BY time', [req.params.id]);
    res.json({ success: true, data: danmus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/contents/:id/danmus', authMiddleware, validateParams(['text', 'time']), async (req, res) => {
  try {
    const { text, time, color } = req.body;
    await runQuery('INSERT INTO danmus (content_id, user_id, text, time, color) VALUES (?, ?, ?, ?, ?)', [req.params.id, req.user.id, text, time, color || '#ffffff']);
    res.json({ success: true, message: '弹幕发送成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/contents/:id/like', authMiddleware, async (req, res) => {
  try {
    await runQuery('INSERT OR IGNORE INTO likes (content_id, user_id) VALUES (?, ?)', [req.params.id, req.user.id]);
    await runQuery('UPDATE contents SET likes = likes + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '点赞成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/contents/:id/like', authMiddleware, async (req, res) => {
  try {
    await runQuery('DELETE FROM likes WHERE content_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    await runQuery('UPDATE contents SET likes = likes - 1 WHERE id = ? AND likes > 0', [req.params.id]);
    res.json({ success: true, message: '取消点赞成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [];
    
    if (category) {
      whereClause = 'WHERE category = ?';
      params.push(category);
    }
    
    const products = await allQuery(`SELECT * FROM products ${whereClause} ORDER BY sales DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    const total = await getQuery(`SELECT COUNT(*) as count FROM products ${whereClause}`, params);
    
    res.json({ success: true, data: { list: products, total: total.count, page: parseInt(page) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { keyword, type = 'content', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    if (!keyword) {
      return res.json({ success: true, data: { list: [], total: 0 } });
    }
    
    let results = [];
    let total = 0;
    
    if (type === 'content') {
      results = await allQuery(`
        SELECT c.*, u.nickname as author_name 
        FROM contents c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.title LIKE ? OR c.description LIKE ? OR c.tags LIKE ?
        ORDER BY c.views DESC 
        LIMIT ? OFFSET ?
      `, [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, parseInt(limit), offset]);
      
      const totalResult = await getQuery(`
        SELECT COUNT(*) as count FROM contents 
        WHERE title LIKE ? OR description LIKE ? OR tags LIKE ?
      `, [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]);
      total = totalResult.count;
    } else if (type === 'user') {
      results = await allQuery(`
        SELECT * FROM users 
        WHERE nickname LIKE ? OR phone LIKE ?
        LIMIT ? OFFSET ?
      `, [`%${keyword}%`, `%${keyword}%`, parseInt(limit), offset]);
      
      const totalResult = await getQuery(`
        SELECT COUNT(*) as count FROM users 
        WHERE nickname LIKE ? OR phone LIKE ?
      `, [`%${keyword}%`, `%${keyword}%`]);
      total = totalResult.count;
    }
    
    res.json({ success: true, data: { list: results, total, page: parseInt(page) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
