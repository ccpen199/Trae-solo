import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/banners', (req, res) => {
  const banners = db.prepare('SELECT * FROM banners WHERE status = 1 ORDER BY sort ASC').all();
  res.json({ success: true, data: banners });
});

router.get('/articles', (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM articles WHERE status = 1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const articles = db.prepare(query).all(...params);
  
  const countQuery = category 
    ? 'SELECT COUNT(*) as total FROM articles WHERE status = 1 AND category = ?'
    : 'SELECT COUNT(*) as total FROM articles WHERE status = 1';
  const { total } = db.prepare(countQuery).get(category || []);

  res.json({
    success: true,
    data: {
      list: articles,
      total,
      page: Number(page),
      limit: Number(limit)
    }
  });
});

router.get('/articles/:id', (req, res) => {
  const { id } = req.params;
  
  db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(id);
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  res.json({ success: true, data: article });
});

router.get('/hotels', (req, res) => {
  const { page = 1, limit = 10, keyword, minPrice, maxPrice, star } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM hotels WHERE status = 1';
  const params = [];

  if (keyword) {
    query += ' AND (name LIKE ? OR address LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (minPrice) {
    query += ' AND price >= ?';
    params.push(Number(minPrice));
  }

  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(Number(maxPrice));
  }

  if (star) {
    query += ' AND star = ?';
    params.push(Number(star));
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const hotels = db.prepare(query).all(...params);

  res.json({
    success: true,
    data: {
      list: hotels,
      page: Number(page),
      limit: Number(limit)
    }
  });
});

router.get('/hotels/:id', (req, res) => {
  const { id } = req.params;
  const hotel = db.prepare('SELECT * FROM hotels WHERE id = ?').get(id);
  
  if (!hotel) {
    return res.status(404).json({ error: '酒店不存在' });
  }

  const rooms = db.prepare('SELECT * FROM rooms WHERE hotel_id = ? AND status = 1').all(id);
  
  res.json({
    success: true,
    data: {
      ...hotel,
      rooms
    }
  });
});

router.get('/exchange-rates', (req, res) => {
  const rates = db.prepare('SELECT * FROM exchange_rates').all();
  res.json({ success: true, data: rates });
});

export default router;
