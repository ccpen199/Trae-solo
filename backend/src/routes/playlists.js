const express = require('express');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, limit = 20, user_id, sort = 'hot' } = req.query;
  const offset = (page - 1) * limit;

  let where = ['is_public = 1'];
  let params = [];

  if (user_id) {
    where.push('user_id = ?');
    params.push(user_id);
  }

  const whereClause = 'WHERE ' + where.join(' AND ');
  const orderBy = sort === 'hot' ? '(likes * 2 + views) DESC' :
                  sort === 'newest' ? 'created_at DESC' : 'id DESC';

  const playlists = db.prepare(`
    SELECT p.*, u.username, u.avatar
    FROM playlists p
    JOIN users u ON p.user_id = u.id
    ${whereClause}
    ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM playlists ${whereClause}`).get(...params);

  res.json({
    data: playlists,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/:id', (req, res) => {
  const playlist = db.prepare(`
    SELECT p.*, u.username, u.avatar
    FROM playlists p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!playlist) {
    return res.status(404).json({ error: '片单不存在' });
  }

  const items = db.prepare(`
    SELECT pi.*,
      CASE WHEN pi.content_type = 'movie' THEN m.title ELSE t.title END as content_title,
      CASE WHEN pi.content_type = 'movie' THEN m.poster_url ELSE t.poster_url END as content_poster,
      CASE WHEN pi.content_type = 'movie' THEN m.rating ELSE t.rating END as content_rating,
      CASE WHEN pi.content_type = 'movie' THEN m.year ELSE t.start_year END as content_year
    FROM playlist_items pi
    LEFT JOIN movies m ON pi.content_type = 'movie' AND pi.content_id = m.id
    LEFT JOIN tv_shows t ON pi.content_type = 'tv' AND pi.content_id = t.id
    WHERE pi.playlist_id = ?
    ORDER BY pi.sort_order ASC, pi.added_at DESC
  `).all(req.params.id);

  db.prepare('UPDATE playlists SET views = views + 1 WHERE id = ?').run(req.params.id);
  playlist.views += 1;

  res.json({ playlist, items });
});

router.post('/', authenticateToken, (req, res) => {
  const { title, description, cover_url, is_public } = req.body;

  if (!title) {
    return res.status(400).json({ error: '请填写标题' });
  }

  const result = db.prepare(`
    INSERT INTO playlists (user_id, title, description, cover_url, is_public)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    req.user.id, title, description || null,
    cover_url || null, is_public !== undefined ? is_public : 1
  );

  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ playlist });
});

router.post('/:id/items', authenticateToken, (req, res) => {
  const { content_type, content_id, note } = req.body;

  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id);
  if (!playlist) {
    return res.status(404).json({ error: '片单不存在' });
  }

  if (playlist.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限修改此片单' });
  }

  if (!content_type || !content_id) {
    return res.status(400).json({ error: '请选择内容' });
  }

  try {
    const maxSort = db.prepare(`
      SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM playlist_items WHERE playlist_id = ?
    `).get(req.params.id);

    db.prepare(`
      INSERT INTO playlist_items 
      (playlist_id, content_type, content_id, note, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, content_type, content_id, note || null, maxSort.next_order);

    db.prepare('UPDATE playlists SET item_count = item_count + 1 WHERE id = ?').run(req.params.id);

    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: '该内容已在片单中' });
    }
    throw err;
  }
});

router.delete('/:id/items/:itemId', authenticateToken, (req, res) => {
  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id);
  if (!playlist) {
    return res.status(404).json({ error: '片单不存在' });
  }

  if (playlist.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限修改此片单' });
  }

  db.prepare('DELETE FROM playlist_items WHERE id = ? AND playlist_id = ?').run(req.params.itemId, req.params.id);
  db.prepare('UPDATE playlists SET item_count = item_count - 1 WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

router.post('/:id/like', authenticateToken, (req, res) => {
  const existing = db.prepare(`
    SELECT id FROM user_likes WHERE user_id = ? AND target_type = 'playlist' AND target_id = ?
  `).get(req.user.id, req.params.id);

  if (existing) {
    db.prepare('DELETE FROM user_likes WHERE id = ?').run(existing.id);
    db.prepare('UPDATE playlists SET likes = likes - 1 WHERE id = ?').run(req.params.id);
    res.json({ liked: false, likes: db.prepare('SELECT likes FROM playlists WHERE id = ?').get(req.params.id).likes });
  } else {
    db.prepare(`
      INSERT INTO user_likes (user_id, target_type, target_id) VALUES (?, 'playlist', ?)
    `).run(req.user.id, req.params.id);
    db.prepare('UPDATE playlists SET likes = likes + 1 WHERE id = ?').run(req.params.id);
    res.json({ liked: true, likes: db.prepare('SELECT likes FROM playlists WHERE id = ?').get(req.params.id).likes });
  }
});

module.exports = router;
