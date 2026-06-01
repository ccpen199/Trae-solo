const express = require('express');
const { db } = require('../models/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  const { page = 1, limit = 10, destination, keyword, minPrice, maxPrice, stars, sort } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM hotels WHERE 1=1';
  const params = [];
  
  if (destination) {
    query += ' AND destination = ?';
    params.push(destination);
  }
  
  if (keyword) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (minPrice) {
    query += ' AND price >= ?';
    params.push(parseFloat(minPrice));
  }
  
  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(parseFloat(maxPrice));
  }
  
  if (stars) {
    query += ' AND stars = ?';
    params.push(parseInt(stars));
  }
  
  if (sort === 'price') {
    query += ' ORDER BY price ASC';
  } else if (sort === 'rating') {
    query += ' ORDER BY rating DESC';
  } else {
    query += ' ORDER BY created_at DESC';
  }
  
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const hotels = db.prepare(query).all(...params);
  
  hotels.forEach(h => {
    if (req.user) {
      const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user.id, 'hotel', h.id);
      h.is_favorited = !!fav;
    }
  });
  
  const total = db.prepare('SELECT COUNT(*) as count FROM hotels').get();
  
  res.json({
    list: hotels,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/:id', optionalAuth, (req, res) => {
  const hotel = db.prepare('SELECT * FROM hotels WHERE id = ?').get(req.params.id);
  
  if (!hotel) {
    return res.status(404).json({ error: '酒店不存在' });
  }
  
  if (req.user) {
    const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user.id, 'hotel', hotel.id);
    hotel.is_favorited = !!fav;
  }
  
  res.json(hotel);
});

router.post('/:id/order', authenticateToken, (req, res) => {
  const { checkin_date, checkout_date, rooms, guests } = req.body;
  
  if (!checkin_date || !checkout_date) {
    return res.status(400).json({ error: '请选择入住和退房日期' });
  }
  
  const hotel = db.prepare('SELECT * FROM hotels WHERE id = ?').get(req.params.id);
  const nights = Math.ceil((new Date(checkout_date) - new Date(checkin_date)) / (1000 * 60 * 60 * 24));
  const total_amount = hotel.price * nights * (rooms || 1);
  
  const order_no = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
  
  const stmt = db.prepare(`
    INSERT INTO orders (user_id, hotel_id, order_no, checkin_date, checkout_date, rooms, guests, total_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(req.user.id, req.params.id, order_no, checkin_date, checkout_date, rooms || 1, guests || 1, total_amount);
  
  res.json({ id: result.lastInsertRowid, order_no, total_amount, message: '下单成功' });
});

module.exports = router;
