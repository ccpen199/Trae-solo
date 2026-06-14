const express = require('express');
const { db } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { analyzeSentiment } = require('../utils/sentiment');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, limit = 20, content_type, content_id, user_id, sentiment, sort = 'hot' } = req.query;
  const offset = (page - 1) * limit;

  let where = ['r.status = ?'];
  let params = ['approved'];

  if (content_type && content_id) {
    where.push('content_type = ? AND content_id = ?');
    params.push(content_type, content_id);
  }
  if (user_id) {
    where.push('user_id = ?');
    params.push(user_id);
  }
  if (sentiment) {
    where.push('sentiment_label = ?');
    params.push(sentiment);
  }

  const whereClause = 'WHERE ' + where.join(' AND ');
  const orderBy = sort === 'hot' ? '(likes * 2 + comments + views) DESC' :
                  sort === 'newest' ? 'created_at DESC' :
                  sort === 'rating' ? 'rating DESC' : 'id DESC';

  const reviews = db.prepare(`
    SELECT r.*, u.username, u.avatar,
      CASE WHEN r.content_type = 'movie' THEN m.title ELSE t.title END as content_title,
      CASE WHEN r.content_type = 'movie' THEN m.poster_url ELSE t.poster_url END as content_poster
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN movies m ON r.content_type = 'movie' AND r.content_id = m.id
    LEFT JOIN tv_shows t ON r.content_type = 'tv' AND r.content_id = t.id
    ${whereClause}
    ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const totalWhere = where.map(w => w.replace('r.', '')).join(' AND ');
  const total = db.prepare(`
    SELECT COUNT(*) as count 
    FROM reviews
    WHERE ${totalWhere}
  `).get(...params);

  res.json({
    data: reviews,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/:id', (req, res) => {
  const review = db.prepare(`
    SELECT r.*, u.username, u.avatar,
      CASE WHEN r.content_type = 'movie' THEN m.title ELSE t.title END as content_title,
      CASE WHEN r.content_type = 'movie' THEN m.poster_url ELSE t.poster_url END as content_poster
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN movies m ON r.content_type = 'movie' AND r.content_id = m.id
    LEFT JOIN tv_shows t ON r.content_type = 'tv' AND r.content_id = t.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!review) {
    return res.status(404).json({ error: '影评不存在' });
  }

  db.prepare('UPDATE reviews SET views = views + 1 WHERE id = ?').run(req.params.id);
  review.views += 1;

  res.json({ review });
});

router.post('/', authenticateToken, (req, res) => {
  const { content_type, content_id, title, content, rating } = req.body;

  if (!content_type || !content_id || !content || rating === undefined) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const sentiment = analyzeSentiment(content);

  const result = db.prepare(`
    INSERT INTO reviews 
    (user_id, content_type, content_id, title, content, rating, sentiment_score, sentiment_label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, content_type, content_id, title || null, content,
    parseFloat(rating), sentiment.score, sentiment.label
  );

  if (content_type === 'movie') {
    db.prepare(`
      UPDATE movies SET 
        rating = (SELECT AVG(rating) FROM reviews WHERE content_type = 'movie' AND content_id = ? AND status = 'approved'),
        vote_count = vote_count + 1
      WHERE id = ?
    `).run(content_id, content_id);
  }

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ review, sentiment });
});

router.post('/:id/like', authenticateToken, (req, res) => {
  const existing = db.prepare(`
    SELECT id FROM user_likes WHERE user_id = ? AND target_type = 'review' AND target_id = ?
  `).get(req.user.id, req.params.id);

  if (existing) {
    db.prepare('DELETE FROM user_likes WHERE id = ?').run(existing.id);
    db.prepare('UPDATE reviews SET likes = likes - 1 WHERE id = ?').run(req.params.id);
    res.json({ liked: false, likes: db.prepare('SELECT likes FROM reviews WHERE id = ?').get(req.params.id).likes });
  } else {
    db.prepare(`
      INSERT INTO user_likes (user_id, target_type, target_id) VALUES (?, 'review', ?)
    `).run(req.user.id, req.params.id);
    db.prepare('UPDATE reviews SET likes = likes + 1 WHERE id = ?').run(req.params.id);
    res.json({ liked: true, likes: db.prepare('SELECT likes FROM reviews WHERE id = ?').get(req.params.id).likes });
  }
});

module.exports = router;
