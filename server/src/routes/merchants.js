const express = require('express');
const db = require('../database/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { city, category, page = 1, pageSize = 10, sort = 'rating' } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE m.status = 1';
  const params = [];
  
  if (city) {
    where += ' AND m.city = ?';
    params.push(city);
  }
  
  if (category) {
    where += ' AND m.category = ?';
    params.push(category);
  }
  
  const sortMap = {
    rating: 'm.rating DESC',
    reviews: 'm.review_count DESC',
    likes: 'm.like_count DESC',
    newest: 'm.id DESC'
  };
  
  const orderBy = sortMap[sort] || 'm.rating DESC';
  
  const merchants = db.prepare(`
    SELECT m.*, u.username, u.avatar, u.real_name
    FROM merchants m
    LEFT JOIN users u ON m.user_id = u.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM merchants m ${where}`).get(...params).count;
  
  merchants.forEach(m => {
    m.images = m.images ? JSON.parse(m.images) : [];
    m.tags = m.tags ? JSON.parse(m.tags) : [];
  });
  
  res.json({ data: merchants, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const merchant = db.prepare(`
    SELECT m.*, u.username, u.avatar, u.real_name
    FROM merchants m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.id = ? AND m.status = 1
  `).get(req.params.id);
  
  if (!merchant) {
    return res.status(404).json({ error: '商家不存在' });
  }
  
  db.prepare('UPDATE merchants SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
  merchant.view_count++;
  
  res.json(merchant);
});

router.put('/profile', auth(['merchant']), (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id);
  if (!merchant) {
    return res.status(404).json({ error: '商家信息不存在' });
  }
  
  const { company_name, category, description, logo, address, city, contact_name, contact_phone } = req.body;
  
  db.prepare(`
    UPDATE merchants 
    SET company_name = ?, category = ?, description = ?, logo = ?, address = ?, 
        city = ?, contact_name = ?, contact_phone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(company_name, category, description, logo, address, city, contact_name, contact_phone, req.user.id);
  
  res.json({ message: '更新成功' });
});

router.post('/:id/like', auth(), (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(id);
  if (!merchant) {
    return res.status(404).json({ error: '商家不存在' });
  }
  
  try {
    db.prepare('INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)')
      .run(userId, 'merchant', id);
    db.prepare('UPDATE merchants SET like_count = like_count + 1 WHERE id = ?').run(id);
    res.json({ liked: true, like_count: merchant.like_count + 1 });
  } catch (err) {
    db.prepare('DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?')
      .run(userId, 'merchant', id);
    db.prepare('UPDATE merchants SET like_count = like_count - 1 WHERE id = ?').run(id);
    res.json({ liked: false, like_count: Math.max(0, merchant.like_count - 1) });
  }
});

module.exports = router;
