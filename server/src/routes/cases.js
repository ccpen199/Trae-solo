const express = require('express');
const db = require('../database/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { city, category, merchant_id, page = 1, pageSize = 12, sort = 'likes' } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE c.status = 1';
  const params = [];
  
  if (city) {
    where += ' AND c.city = ?';
    params.push(city);
  }
  
  if (merchant_id) {
    where += ' AND c.merchant_id = ?';
    params.push(merchant_id);
  }
  
  const sortMap = {
    likes: 'c.like_count DESC',
    views: 'c.view_count DESC',
    newest: 'c.id DESC'
  };
  
  const orderBy = sortMap[sort] || 'c.like_count DESC';
  
  const cases = db.prepare(`
    SELECT c.*, m.company_name, m.logo as merchant_logo, s.name as service_name
    FROM cases c
    LEFT JOIN merchants m ON c.merchant_id = m.id
    LEFT JOIN services s ON c.service_id = s.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM cases c ${where}`).get(...params).count;
  
  cases.forEach(c => {
    c.images = c.images ? JSON.parse(c.images) : [];
    c.videos = c.videos ? JSON.parse(c.videos) : [];
  });
  
  res.json({ data: cases, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const caseItem = db.prepare(`
    SELECT c.*, m.company_name, m.logo as merchant_logo, s.name as service_name, s.category as service_category
    FROM cases c
    LEFT JOIN merchants m ON c.merchant_id = m.id
    LEFT JOIN services s ON c.service_id = s.id
    WHERE c.id = ? AND c.status = 1
  `).get(req.params.id);
  
  if (!caseItem) {
    return res.status(404).json({ error: '案例不存在' });
  }
  
  db.prepare('UPDATE cases SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
  caseItem.view_count++;
  
  caseItem.images = caseItem.images ? JSON.parse(caseItem.images) : [];
  caseItem.videos = caseItem.videos ? JSON.parse(caseItem.videos) : [];
  
  res.json(caseItem);
});

router.post('/', auth(['merchant']), (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id);
  if (!merchant) {
    return res.status(404).json({ error: '商家信息不存在' });
  }
  
  const { service_id, title, description, cover_image, images, videos, date, budget, city } = req.body;
  
  const result = db.prepare(`
    INSERT INTO cases (merchant_id, service_id, title, description, cover_image, images, videos, date, budget, city)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    merchant.id, service_id, title, description, cover_image,
    JSON.stringify(images || []), JSON.stringify(videos || []),
    date, budget, city || merchant.city
  );
  
  res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/:id', auth(['merchant']), (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id);
  const caseItem = db.prepare('SELECT * FROM cases WHERE id = ? AND merchant_id = ?').get(req.params.id, merchant?.id);
  
  if (!caseItem) {
    return res.status(404).json({ error: '案例不存在或无权限修改' });
  }
  
  const { service_id, title, description, cover_image, images, videos, date, budget, city, status } = req.body;
  
  db.prepare(`
    UPDATE cases 
    SET service_id = ?, title = ?, description = ?, cover_image = ?, images = ?, 
        videos = ?, date = ?, budget = ?, city = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    service_id ?? caseItem.service_id, title, description, cover_image,
    JSON.stringify(images || caseItem.images || []),
    JSON.stringify(videos || caseItem.videos || []),
    date, budget, city, status ?? caseItem.status,
    req.params.id
  );
  
  res.json({ message: '更新成功' });
});

router.delete('/:id', auth(['merchant']), (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id);
  const caseItem = db.prepare('SELECT * FROM cases WHERE id = ? AND merchant_id = ?').get(req.params.id, merchant?.id);
  
  if (!caseItem) {
    return res.status(404).json({ error: '案例不存在或无权限删除' });
  }
  
  db.prepare('UPDATE cases SET status = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.post('/:id/like', auth(), (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const caseItem = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
  if (!caseItem) {
    return res.status(404).json({ error: '案例不存在' });
  }
  
  try {
    db.prepare('INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)')
      .run(userId, 'case', id);
    db.prepare('UPDATE cases SET like_count = like_count + 1 WHERE id = ?').run(id);
    res.json({ liked: true, like_count: caseItem.like_count + 1 });
  } catch (err) {
    db.prepare('DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?')
      .run(userId, 'case', id);
    db.prepare('UPDATE cases SET like_count = like_count - 1 WHERE id = ?').run(id);
    res.json({ liked: false, like_count: Math.max(0, caseItem.like_count - 1) });
  }
});

router.get('/ranking/likes', (req, res) => {
  const { city, limit = 10 } = req.query;
  
  let where = 'WHERE status = 1';
  const params = [];
  
  if (city) {
    where += ' AND city = ?';
    params.push(city);
  }
  
  const ranking = db.prepare(`
    SELECT id, title, cover_image, like_count, view_count, merchant_id, budget
    FROM cases
    ${where}
    ORDER BY like_count DESC
    LIMIT ?
  `).all(...params, parseInt(limit));
  
  res.json(ranking);
});

module.exports = router;
