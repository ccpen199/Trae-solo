const express = require('express');
const db = require('../database/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { merchant_id, service_id, verified, page = 1, pageSize = 10, sort = 'newest' } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (merchant_id) {
    where += ' AND r.merchant_id = ?';
    params.push(merchant_id);
  }
  
  if (service_id) {
    where += ' AND r.service_id = ?';
    params.push(service_id);
  }
  
  if (verified !== undefined) {
    where += ' AND r.verified = ?';
    params.push(parseInt(verified));
  }
  
  const sortMap = {
    newest: 'r.created_at DESC',
    rating_high: 'r.rating DESC',
    rating_low: 'r.rating ASC',
    helpful: 'r.helpful_count DESC'
  };
  
  const orderBy = sortMap[sort] || 'r.created_at DESC';
  
  const reviews = db.prepare(`
    SELECT r.*, u.username, u.avatar, u.real_name, s.name as service_name, m.company_name
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN services s ON r.service_id = s.id
    LEFT JOIN merchants m ON r.merchant_id = m.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM reviews r ${where}`).get(...params).count;
  
  reviews.forEach(r => {
    r.images = r.images ? JSON.parse(r.images) : [];
    r.videos = r.videos ? JSON.parse(r.videos) : [];
  });
  
  const stats = db.prepare(`
    SELECT 
      AVG(rating) as avg_rating,
      COUNT(*) as total_count,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as count_5,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as count_4,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as count_3,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as count_2,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as count_1
    FROM reviews r
    ${where}
  `).get(...params);
  
  res.json({ data: reviews, total, page: parseInt(page), pageSize: parseInt(pageSize), stats });
});

router.post('/', auth(['couple']), (req, res) => {
  const { merchant_id, service_id, order_id, rating, content, images, videos } = req.body;
  
  if (!merchant_id || !rating || !content) {
    return res.status(400).json({ error: '请填写完整评价信息' });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: '评分必须在1-5之间' });
  }
  
  let verified = 0;
  if (order_id) {
    const order = db.prepare(`
      SELECT * FROM orders 
      WHERE id = ? AND user_id = ? AND merchant_id = ? AND status >= 2
    `).get(order_id, req.user.id, merchant_id);
    if (order) {
      verified = 1;
    }
  }
  
  const result = db.prepare(`
    INSERT INTO reviews (user_id, merchant_id, service_id, order_id, rating, content, images, videos, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, merchant_id, service_id, order_id, rating, content,
    JSON.stringify(images || []), JSON.stringify(videos || []), verified
  );
  
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(merchant_id);
  const newReviewCount = merchant.review_count + 1;
  const newRating = ((merchant.rating * merchant.review_count) + rating) / newReviewCount;
  
  db.prepare(`
    UPDATE merchants 
    SET rating = ?, review_count = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(Math.round(newRating * 10) / 10, newReviewCount, merchant_id);
  
  if (service_id) {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);
    const newServiceReviewCount = service.review_count + 1;
    const newServiceRating = ((service.rating * service.review_count) + rating) / newServiceReviewCount;
    
    db.prepare(`
      UPDATE services 
      SET rating = ?, review_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(Math.round(newServiceRating * 10) / 10, newServiceReviewCount, service_id);
  }
  
  res.status(201).json({ id: result.lastInsertRowid, message: '评价成功' });
});

router.post('/:id/helpful', auth(), (req, res) => {
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) {
    return res.status(404).json({ error: '评价不存在' });
  }
  
  db.prepare('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?').run(req.params.id);
  res.json({ helpful_count: review.helpful_count + 1 });
});

module.exports = router;
