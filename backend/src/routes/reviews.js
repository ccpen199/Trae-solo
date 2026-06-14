const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, (req, res) => {
  const { listing_id, reviewee_id, rating, content, tags } = req.body;

  if (!listing_id || !reviewee_id || !rating) {
    return res.status(400).json({ error: '参数不完整' });
  }

  const result = db.prepare(`
    INSERT INTO reviews (listing_id, reviewer_id, reviewee_id, rating, content, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(listing_id, req.user.id, reviewee_id, rating, content || '', tags ? JSON.stringify(tags) : '');

  const avgRating = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE reviewee_id = ?').get(reviewee_id).avg;
  const creditScore = Math.min(100, Math.max(50, Math.round(avgRating * 20)));
  db.prepare('UPDATE users SET credit_score = ? WHERE id = ?').run(creditScore, reviewee_id);

  res.json({ id: result.lastInsertRowid, message: '评价成功' });
});

router.get('/user/:userId', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, u.nickname as reviewer_name, l.title as listing_title
    FROM reviews r
    LEFT JOIN users u ON r.reviewer_id = u.id
    LEFT JOIN listings l ON r.listing_id = l.id
    WHERE r.reviewee_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.userId);

  const avgRating = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE reviewee_id = ?').get(req.params.userId).avg || 0;

  res.json({ reviews, avgRating: Math.round(avgRating * 10) / 10 });
});

module.exports = router;
