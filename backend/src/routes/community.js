const express = require('express');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/topics', (req, res) => {
  const { page = 1, limit = 20, category, sort = 'hot' } = req.query;
  const offset = (page - 1) * limit;

  let where = ['is_active = 1'];
  let params = [];

  if (category) {
    where.push('category = ?');
    params.push(category);
  }

  const whereClause = 'WHERE ' + where.join(' AND ');
  const orderBy = sort === 'hot' ? '(post_count * 2 + member_count) DESC' :
                  sort === 'newest' ? 'created_at DESC' : 'id DESC';

  const topics = db.prepare(`
    SELECT t.*, u.username as creator_name, u.avatar as creator_avatar
    FROM topics t
    JOIN users u ON t.creator_id = u.id
    ${whereClause}
    ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM topics ${whereClause}`).get(...params);

  res.json({
    data: topics,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/topics/:id', (req, res) => {
  const topic = db.prepare(`
    SELECT t.*, u.username as creator_name, u.avatar as creator_avatar
    FROM topics t
    JOIN users u ON t.creator_id = u.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!topic) {
    return res.status(404).json({ error: '话题组不存在' });
  }

  const posts = db.prepare(`
    SELECT p.*, u.username, u.avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.topic_id = ? AND p.status = 'published'
    ORDER BY (p.likes * 2 + p.comments + p.views) DESC
    LIMIT 20
  `).all(req.params.id);

  res.json({ topic, posts });
});

router.post('/topics', authenticateToken, (req, res) => {
  const { title, description, category, cover_url } = req.body;

  if (!title) {
    return res.status(400).json({ error: '请填写标题' });
  }

  const result = db.prepare(`
    INSERT INTO topics (title, description, category, cover_url, creator_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, description || null, category || null, cover_url || null, req.user.id);

  db.prepare(`
    INSERT INTO topic_members (topic_id, user_id, role) VALUES (?, ?, 'admin')
  `).run(result.lastInsertRowid, req.user.id);

  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ topic });
});

router.get('/topics/:id/posts', (req, res) => {
  const { page = 1, limit = 20, sort = 'hot' } = req.query;
  const offset = (page - 1) * limit;

  const orderBy = sort === 'hot' ? '(p.likes * 2 + p.comments + p.views) DESC' :
                  sort === 'newest' ? 'p.created_at DESC' : 'p.id DESC';

  const posts = db.prepare(`
    SELECT p.*, u.username, u.avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.topic_id = ? AND p.status = 'published'
    ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(req.params.id, parseInt(limit), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM posts WHERE topic_id = ? AND status = 'published'
  `).get(req.params.id);

  res.json({
    data: posts,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.post('/topics/:id/posts', authenticateToken, (req, res) => {
  const { title, content } = req.body;

  if (!content) {
    return res.status(400).json({ error: '请填写内容' });
  }

  const result = db.prepare(`
    INSERT INTO posts (topic_id, user_id, title, content)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.user.id, title || null, content);

  db.prepare('UPDATE topics SET post_count = post_count + 1 WHERE id = ?').run(req.params.id);

  const post = db.prepare(`
    SELECT p.*, u.username, u.avatar
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ post });
});

router.get('/battles', (req, res) => {
  const { page = 1, limit = 10, status = 'active' } = req.query;
  const offset = (page - 1) * limit;

  const battles = db.prepare(`
    SELECT b.*, u.username as creator_name, u.avatar as creator_avatar
    FROM battles b
    JOIN users u ON b.creator_id = u.id
    WHERE b.status = ?
    ORDER BY (b.votes_a + b.votes_b) DESC
    LIMIT ? OFFSET ?
  `).all(status, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM battles WHERE status = ?`).get(status);

  res.json({
    battles,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/battles/:id', (req, res) => {
  const battle = db.prepare(`
    SELECT b.*, u.username as creator_name, u.avatar as creator_avatar
    FROM battles b
    JOIN users u ON b.creator_id = u.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!battle) {
    return res.status(404).json({ error: '对战不存在' });
  }

  const votes = db.prepare(`
    SELECT bv.*, u.username, u.avatar
    FROM battle_votes bv
    JOIN users u ON bv.user_id = u.id
    WHERE bv.battle_id = ?
    ORDER BY bv.created_at DESC
    LIMIT 20
  `).all(req.params.id);

  res.json({ battle, votes });
});

router.post('/battles/:id/vote', authenticateToken, (req, res) => {
  const { vote_side, argument } = req.body;

  if (!vote_side || !['a', 'b'].includes(vote_side)) {
    return res.status(400).json({ error: '请选择投票方' });
  }

  const existing = db.prepare(`
    SELECT id FROM battle_votes WHERE battle_id = ? AND user_id = ?
  `).get(req.params.id, req.user.id);

  if (existing) {
    return res.status(400).json({ error: '您已经投过票了' });
  }

  db.prepare(`
    INSERT INTO battle_votes (battle_id, user_id, vote_side, argument)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.user.id, vote_side, argument || null);

  const column = vote_side === 'a' ? 'votes_a' : 'votes_b';
  db.prepare(`UPDATE battles SET ${column} = ${column} + 1 WHERE id = ?`).run(req.params.id);

  const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(req.params.id);
  res.json({ battle });
});

router.post('/battles', authenticateToken, (req, res) => {
  const { title, description, topic_a, topic_b, cover_url } = req.body;

  if (!title || !topic_a || !topic_b) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const result = db.prepare(`
    INSERT INTO battles (title, description, topic_a, topic_b, cover_url, creator_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, description || null, topic_a, topic_b, cover_url || null, req.user.id);

  const battle = db.prepare('SELECT * FROM battles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ battle });
});

router.get('/viewing-groups', (req, res) => {
  const { page = 1, limit = 10, status = 'upcoming' } = req.query;
  const offset = (page - 1) * limit;

  const groups = db.prepare(`
    SELECT vg.*, u.username as creator_name, m.title as movie_title, m.poster_url as movie_poster
    FROM viewing_groups vg
    JOIN users u ON vg.creator_id = u.id
    LEFT JOIN movies m ON vg.movie_id = m.id
    WHERE vg.status = ?
    ORDER BY vg.scheduled_at ASC
    LIMIT ? OFFSET ?
  `).all(status, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM viewing_groups WHERE status = ?`).get(status);

  res.json({
    data: groups,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.post('/viewing-groups', authenticateToken, (req, res) => {
  const { name, description, cover_url, movie_id, scheduled_at, location, max_members } = req.body;

  if (!name || !scheduled_at) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const result = db.prepare(`
    INSERT INTO viewing_groups 
    (name, description, cover_url, creator_id, movie_id, scheduled_at, location, max_members)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, description || null, cover_url || null, req.user.id,
    movie_id || null, scheduled_at, location || null, max_members || 50
  );

  db.prepare(`
    INSERT INTO viewing_group_members (group_id, user_id, role) VALUES (?, ?, 'admin')
  `).run(result.lastInsertRowid, req.user.id);

  const group = db.prepare('SELECT * FROM viewing_groups WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ group });
});

module.exports = router;
