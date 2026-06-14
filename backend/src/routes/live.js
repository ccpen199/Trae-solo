const express = require('express');
const { db } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;

  let where = [];
  let params = [];

  if (status) {
    where.push('status = ?');
    params.push(status);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const orderBy = 'start_time DESC';

  const streams = db.prepare(`
    SELECT ls.*, u.username as streamer_name, u.avatar as streamer_avatar,
      m.title as movie_title, m.poster_url as movie_poster
    FROM live_streams ls
    JOIN users u ON ls.streamer_id = u.id
    LEFT JOIN movies m ON ls.movie_id = m.id
    ${whereClause}
    ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM live_streams ${whereClause}`).get(...params);

  res.json({
    data: streams,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/:id', (req, res) => {
  const stream = db.prepare(`
    SELECT ls.*, u.username as streamer_name, u.avatar as streamer_avatar,
      m.title as movie_title, m.poster_url as movie_poster
    FROM live_streams ls
    JOIN users u ON ls.streamer_id = u.id
    LEFT JOIN movies m ON ls.movie_id = m.id
    WHERE ls.id = ?
  `).get(req.params.id);

  if (!stream) {
    return res.status(404).json({ error: '直播不存在' });
  }

  res.json({ stream });
});

router.post('/', authenticateToken, (req, res) => {
  const { title, description, movie_id, start_time, cover_url } = req.body;

  if (!title || !start_time) {
    return res.status(400).json({ error: '请填写标题和开播时间' });
  }

  const roomId = 'cinehub-live-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const streamUrl = `rtmp://127.0.0.1:1935/live/${roomId}`;

  const result = db.prepare(`
    INSERT INTO live_streams 
    (title, description, streamer_id, movie_id, room_id, stream_url, 
     cover_url, start_time, status, is_copyright_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 0)
  `).run(
    title, description || null, req.user.id, movie_id || null,
    roomId, streamUrl, cover_url || null, start_time
  );

  const stream = db.prepare('SELECT * FROM live_streams WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ stream });
});

router.post('/:id/start', authenticateToken, (req, res) => {
  const stream = db.prepare('SELECT * FROM live_streams WHERE id = ?').get(req.params.id);
  if (!stream) {
    return res.status(404).json({ error: '直播不存在' });
  }

  if (stream.streamer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限操作此直播' });
  }

  if (!stream.is_copyright_verified) {
    return res.status(400).json({ error: '直播版权未通过校验，无法开播' });
  }

  db.prepare(`
    UPDATE live_streams SET status = 'live', start_time = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);

  const updatedStream = db.prepare('SELECT * FROM live_streams WHERE id = ?').get(req.params.id);
  res.json({ stream: updatedStream });
});

router.post('/:id/end', authenticateToken, (req, res) => {
  const stream = db.prepare('SELECT * FROM live_streams WHERE id = ?').get(req.params.id);
  if (!stream) {
    return res.status(404).json({ error: '直播不存在' });
  }

  if (stream.streamer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限操作此直播' });
  }

  db.prepare(`
    UPDATE live_streams SET status = 'ended', end_time = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);

  const updatedStream = db.prepare('SELECT * FROM live_streams WHERE id = ?').get(req.params.id);
  res.json({ stream: updatedStream });
});

router.put('/:id/verify-copyright', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const { is_verified, copyright_note } = req.body;

  db.prepare(`
    UPDATE live_streams SET
      is_copyright_verified = ?,
      copyright_note = ?
    WHERE id = ?
  `).run(is_verified ? 1 : 0, copyright_note || null, req.params.id);

  const stream = db.prepare('SELECT * FROM live_streams WHERE id = ?').get(req.params.id);
  res.json({ stream });
});

router.post('/:id/viewer', authenticateToken, (req, res) => {
  db.prepare(`
    UPDATE live_streams SET viewer_count = viewer_count + 1 WHERE id = ?
  `).run(req.params.id);

  const stream = db.prepare('SELECT viewer_count FROM live_streams WHERE id = ?').get(req.params.id);
  res.json({ viewer_count: stream.viewer_count });
});

router.post('/:id/like', authenticateToken, (req, res) => {
  db.prepare(`
    UPDATE live_streams SET like_count = like_count + 1 WHERE id = ?
  `).run(req.params.id);

  const stream = db.prepare('SELECT like_count FROM live_streams WHERE id = ?').get(req.params.id);
  res.json({ like_count: stream.like_count });
});

module.exports = router;
