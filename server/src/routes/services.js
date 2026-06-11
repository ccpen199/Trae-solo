const express = require('express');
const db = require('../database/db');
const auth = require('../middleware/auth');

const router = express.Router();

const CATEGORY_MAP = {
  photography: '婚纱摄影',
  emcee: '司仪主持',
  hotel: '婚宴酒店',
  wedding_dress: '婚纱礼服'
};

router.get('/categories', (req, res) => {
  res.json({
    photography: '婚纱摄影',
    emcee: '司仪主持',
    hotel: '婚宴酒店',
    wedding_dress: '婚纱礼服'
  });
});

router.get('/', (req, res) => {
  const { city, category, merchant_id, page = 1, pageSize = 10, sort = 'rating', minPrice, maxPrice } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE s.status = 1';
  const params = [];
  
  if (city) {
    where += ' AND s.city = ?';
    params.push(city);
  }
  
  if (category) {
    where += ' AND s.category = ?';
    params.push(category);
  }
  
  if (merchant_id) {
    where += ' AND s.merchant_id = ?';
    params.push(merchant_id);
  }
  
  if (minPrice) {
    where += ' AND s.price >= ?';
    params.push(parseFloat(minPrice));
  }
  
  if (maxPrice) {
    where += ' AND s.price <= ?';
    params.push(parseFloat(maxPrice));
  }
  
  const sortMap = {
    rating: 's.rating DESC',
    price_asc: 's.price ASC',
    price_desc: 's.price DESC',
    reviews: 's.review_count DESC',
    likes: 's.like_count DESC',
    newest: 's.id DESC'
  };
  
  const orderBy = sortMap[sort] || 's.rating DESC';
  
  const services = db.prepare(`
    SELECT s.*, m.company_name, m.logo as merchant_logo, m.city
    FROM services s
    LEFT JOIN merchants m ON s.merchant_id = m.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM services s ${where}`).get(...params).count;
  
  services.forEach(s => {
    s.images = s.images ? JSON.parse(s.images) : [];
    s.tags = s.tags ? JSON.parse(s.tags) : [];
    s.category_name = CATEGORY_MAP[s.category] || s.category;
  });
  
  res.json({ data: services, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/compare', (req, res) => {
  const { ids } = req.query;
  if (!ids || !Array.isArray(ids) || ids.length < 2) {
    return res.status(400).json({ error: '请选择至少2个服务进行对比' });
  }
  
  const placeholders = ids.map(() => '?').join(',');
  const services = db.prepare(`
    SELECT s.*, m.company_name, m.logo as merchant_logo, m.rating as merchant_rating
    FROM services s
    LEFT JOIN merchants m ON s.merchant_id = m.id
    WHERE s.id IN (${placeholders}) AND s.status = 1
  `).all(...ids);
  
  services.forEach(s => {
    s.images = s.images ? JSON.parse(s.images) : [];
    s.tags = s.tags ? JSON.parse(s.tags) : [];
    s.category_name = CATEGORY_MAP[s.category] || s.category;
  });
  
  res.json(services);
});

router.get('/:id', (req, res) => {
  const service = db.prepare(`
    SELECT s.*, m.company_name, m.logo as merchant_logo, m.city, m.rating as merchant_rating,
           m.description as merchant_description
    FROM services s
    LEFT JOIN merchants m ON s.merchant_id = m.id
    WHERE s.id = ? AND s.status = 1
  `).get(req.params.id);
  
  if (!service) {
    return res.status(404).json({ error: '服务不存在' });
  }
  
  db.prepare('UPDATE services SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
  service.view_count++;
  
  service.images = service.images ? JSON.parse(service.images) : [];
  service.tags = service.tags ? JSON.parse(service.tags) : [];
  service.category_name = CATEGORY_MAP[service.category] || service.category;
  
  res.json(service);
});

router.post('/', auth(['merchant']), (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id);
  if (!merchant) {
    return res.status(404).json({ error: '商家信息不存在' });
  }
  
  const { category, name, description, price, original_price, images, tags, city } = req.body;
  
  const result = db.prepare(`
    INSERT INTO services (merchant_id, category, name, description, price, original_price, images, tags, city)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    merchant.id, category, name, description, price, original_price,
    JSON.stringify(images || []), JSON.stringify(tags || []), city || merchant.city
  );
  
  res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/:id', auth(['merchant']), (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id);
  const service = db.prepare('SELECT * FROM services WHERE id = ? AND merchant_id = ?').get(req.params.id, merchant?.id);
  
  if (!service) {
    return res.status(404).json({ error: '服务不存在或无权限修改' });
  }
  
  const { category, name, description, price, original_price, images, tags, status } = req.body;
  
  db.prepare(`
    UPDATE services 
    SET category = ?, name = ?, description = ?, price = ?, original_price = ?, 
        images = ?, tags = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    category, name, description, price, original_price,
    JSON.stringify(images || service.images || []),
    JSON.stringify(tags || service.tags || []),
    status ?? service.status,
    req.params.id
  );
  
  res.json({ message: '更新成功' });
});

router.delete('/:id', auth(['merchant']), (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id);
  const service = db.prepare('SELECT * FROM services WHERE id = ? AND merchant_id = ?').get(req.params.id, merchant?.id);
  
  if (!service) {
    return res.status(404).json({ error: '服务不存在或无权限删除' });
  }
  
  db.prepare('UPDATE services SET status = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.post('/:id/like', auth(), (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  if (!service) {
    return res.status(404).json({ error: '服务不存在' });
  }
  
  try {
    db.prepare('INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)')
      .run(userId, 'service', id);
    db.prepare('UPDATE services SET like_count = like_count + 1 WHERE id = ?').run(id);
    res.json({ liked: true, like_count: service.like_count + 1 });
  } catch (err) {
    db.prepare('DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?')
      .run(userId, 'service', id);
    db.prepare('UPDATE services SET like_count = like_count - 1 WHERE id = ?').run(id);
    res.json({ liked: false, like_count: Math.max(0, service.like_count - 1) });
  }
});

module.exports = router;
