const express = require('express');
const { db } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, limit = 20, news_type, sort = 'latest' } = req.query;
  const offset = (page - 1) * limit;

  let where = ['n.status = ?'];
  let countWhere = ['n.status = ?'];
  let params = ['published'];

  if (news_type) {
    where.push('n.news_type = ?');
    countWhere.push('n.news_type = ?');
    params.push(news_type);
  }

  const whereClause = 'WHERE ' + where.join(' AND ');
  const countWhereClause = 'WHERE ' + countWhere.join(' AND ');
  const orderBy = sort === 'latest' ? 'n.publish_date DESC' :
                  sort === 'popular' ? 'n.views DESC' : 'n.id DESC';

  const news = db.prepare(`
    SELECT n.*, m.title as related_movie_title, p.name as related_person_name
    FROM news n
    LEFT JOIN movies m ON n.related_movie_id = m.id
    LEFT JOIN people p ON n.related_person_id = p.id
    ${whereClause}
    ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM news n ${countWhereClause}`).get(...params);

  res.json({
    data: news,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/types/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT news_type, COUNT(*) as count
    FROM news
    WHERE status = 'published'
    GROUP BY news_type
  `).all();

  res.json({ stats });
});

router.get('/:id', (req, res) => {
  const news = db.prepare(`
    SELECT n.*, m.title as related_movie_title, p.name as related_person_name
    FROM news n
    LEFT JOIN movies m ON n.related_movie_id = m.id
    LEFT JOIN people p ON n.related_person_id = p.id
    WHERE n.id = ?
  `).get(req.params.id);

  if (!news) {
    return res.status(404).json({ error: '资讯不存在' });
  }

  db.prepare('UPDATE news SET views = views + 1 WHERE id = ?').run(req.params.id);
  news.views += 1;

  const related = db.prepare(`
    SELECT * FROM news 
    WHERE id != ? AND (news_type = ? OR related_movie_id = ?)
    ORDER BY publish_date DESC LIMIT 5
  `).all(news.id, news.news_type, news.related_movie_id);

  res.json({ news, related });
});

router.post('/', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const {
    title, content, summary, news_type, source, source_url,
    related_movie_id, related_person_id, publish_date, image_url
  } = req.body;

  if (!title || !content || !news_type) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  const result = db.prepare(`
    INSERT INTO news 
    (title, content, summary, news_type, source, source_url, related_movie_id, 
     related_person_id, publish_date, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, content, summary || null, news_type, source || null, source_url || null,
    related_movie_id || null, related_person_id || null,
    publish_date || new Date().toISOString(), image_url || null
  );

  const news = db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ news });
});

module.exports = router;
