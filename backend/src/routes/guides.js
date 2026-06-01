const express = require('express');
const { db } = require('../models/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  const { page = 1, limit = 10, destination, keyword } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT g.*, u.nickname, u.avatar 
    FROM guides g 
    LEFT JOIN users u ON g.user_id = u.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (destination) {
    query += ' AND g.destination = ?';
    params.push(destination);
  }
  
  if (keyword) {
    query += ' AND (g.title LIKE ? OR g.content LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  query += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const guides = db.prepare(query).all(...params);
  
  guides.forEach(g => {
    if (req.user) {
      const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user.id, 'guide', g.id);
      g.is_favorited = !!fav;
    }
  });
  
  const total = db.prepare('SELECT COUNT(*) as count FROM guides').get();
  
  res.json({
    list: guides,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/:id', optionalAuth, (req, res) => {
  const guide = db.prepare(`
    SELECT g.*, u.nickname, u.avatar 
    FROM guides g 
    LEFT JOIN users u ON g.user_id = u.id 
    WHERE g.id = ?
  `).get(req.params.id);
  
  if (!guide) {
    return res.status(404).json({ error: '攻略不存在' });
  }
  
  db.prepare('UPDATE guides SET views = views + 1 WHERE id = ?').run(req.params.id);
  guide.views++;
  
  if (req.user) {
    const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user.id, 'guide', guide.id);
    guide.is_favorited = !!fav;
    
    const follow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, guide.user_id);
    guide.is_following = !!follow;
  }
  
  res.json(guide);
});

router.post('/', authenticateToken, (req, res) => {
  const { title, content, cover, destination, days, budget, tags } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容不能为空' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO guides (user_id, title, content, cover, destination, days, budget, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(req.user.id, title, content, cover || '', destination || '', days || 0, budget || 0, tags || '');
  
  res.json({ id: result.lastInsertRowid, message: '发布成功' });
});

router.post('/:id/like', authenticateToken, (req, res) => {
  db.prepare('UPDATE guides SET likes = likes + 1 WHERE id = ?').run(req.params.id);
  res.json({ message: '点赞成功' });
});

router.get('/:id/comments', (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.nickname, u.avatar 
    FROM comments c 
    LEFT JOIN users u ON c.user_id = u.id 
    WHERE c.guide_id = ? 
    ORDER BY c.created_at DESC
  `).all(req.params.id);
  
  res.json(comments);
});

router.post('/:id/comments', authenticateToken, (req, res) => {
  const { content, parent_id } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: '评论内容不能为空' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO comments (guide_id, user_id, content, parent_id)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(req.params.id, req.user.id, content, parent_id || null);
  
  db.prepare('UPDATE guides SET comments_count = comments_count + 1 WHERE id = ?').run(req.params.id);
  
  res.json({ id: result.lastInsertRowid, message: '评论成功' });
});

module.exports = router;
