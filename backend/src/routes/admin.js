const express = require('express');
const { db } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    movies: db.prepare('SELECT COUNT(*) as count FROM movies').get().count,
    tv_shows: db.prepare('SELECT COUNT(*) as count FROM tv_shows').get().count,
    people: db.prepare('SELECT COUNT(*) as count FROM people').get().count,
    reviews: db.prepare('SELECT COUNT(*) as count FROM reviews').get().count,
    reviews_pending: db.prepare("SELECT COUNT(*) as count FROM reviews WHERE status = 'pending'").get().count,
    topics: db.prepare('SELECT COUNT(*) as count FROM topics').get().count,
    posts: db.prepare('SELECT COUNT(*) as count FROM posts').get().count,
    news: db.prepare('SELECT COUNT(*) as count FROM news').get().count,
    quizzes: db.prepare('SELECT COUNT(*) as count FROM quizzes').get().count,
    live_streams: db.prepare('SELECT COUNT(*) as count FROM live_streams').get().count,
    battles: db.prepare('SELECT COUNT(*) as count FROM battles').get().count,
    viewing_groups: db.prepare('SELECT COUNT(*) as count FROM viewing_groups').get().count,
    edit_suggestions_pending: db.prepare("SELECT COUNT(*) as count FROM person_edit_suggestions WHERE status = 'pending'").get().count
  };

  const sentimentTrend = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      sentiment_label,
      COUNT(*) as count
    FROM reviews
    WHERE created_at >= DATE('now', '-30 days') AND status = 'approved'
    GROUP BY DATE(created_at), sentiment_label
    ORDER BY date ASC
  `).all();

  const genreDistribution = db.prepare(`
    SELECT genres, COUNT(*) as count
    FROM movies
    GROUP BY genres
    ORDER BY count DESC
    LIMIT 10
  `).all();

  const regionAttendance = [
    { region: '北京', attendance_rate: 78.5, prediction: 82.3 },
    { region: '上海', attendance_rate: 75.2, prediction: 79.8 },
    { region: '广州', attendance_rate: 71.8, prediction: 76.5 },
    { region: '深圳', attendance_rate: 70.3, prediction: 74.2 },
    { region: '成都', attendance_rate: 68.9, prediction: 72.1 },
    { region: '杭州', attendance_rate: 67.5, prediction: 71.8 },
    { region: '武汉', attendance_rate: 65.2, prediction: 69.3 },
    { region: '西安', attendance_rate: 63.8, prediction: 67.5 }
  ];

  res.json({
    stats,
    sentimentTrend,
    genreDistribution,
    regionAttendance
  });
});

router.get('/reviews/pending', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const reviews = db.prepare(`
    SELECT r.*, u.username, u.avatar,
      CASE WHEN r.content_type = 'movie' THEN m.title ELSE t.title END as content_title
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN movies m ON r.content_type = 'movie' AND r.content_id = m.id
    LEFT JOIN tv_shows t ON r.content_type = 'tv' AND r.content_id = t.id
    WHERE r.status = 'pending'
    ORDER BY r.created_at ASC
    LIMIT ? OFFSET ?
  `).all(parseInt(limit), offset);

  const total = db.prepare("SELECT COUNT(*) as count FROM reviews WHERE status = 'pending'").get();

  res.json({
    reviews,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.post('/reviews/:id/moderate', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const { action, moderation_note } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: '无效的操作' });
  }

  const status = action === 'approve' ? 'approved' : 'rejected';

  db.prepare(`
    UPDATE reviews SET
      status = ?,
      moderation_note = ?,
      moderated_by = ?,
      moderated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, moderation_note || null, req.user.id, req.params.id);

  db.prepare(`
    INSERT INTO moderation_logs 
    (content_type, content_id, action, reason, moderator_id)
    VALUES ('review', ?, ?, ?, ?)
  `).run(req.params.id, action, moderation_note || null, req.user.id);

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  res.json({ review });
});

router.get('/edit-suggestions/pending', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const suggestions = db.prepare(`
    SELECT pes.*, p.name as person_name, u.username as submitter_name
    FROM person_edit_suggestions pes
    JOIN people p ON pes.person_id = p.id
    JOIN users u ON pes.user_id = u.id
    WHERE pes.status = 'pending'
    ORDER BY pes.created_at ASC
  `).all();

  res.json({ suggestions });
});

router.post('/edit-suggestions/:id/moderate', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const { action } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: '无效的操作' });
  }

  const suggestion = db.prepare('SELECT * FROM person_edit_suggestions WHERE id = ?').get(req.params.id);
  if (!suggestion) {
    return res.status(404).json({ error: '建议不存在' });
  }

  if (action === 'approve') {
    const field = suggestion.field_name;
    db.prepare(`UPDATE people SET ${field} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(suggestion.new_value, suggestion.person_id);
  }

  db.prepare(`
    UPDATE person_edit_suggestions SET
      status = ?,
      reviewer_id = ?,
      reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(action === 'approve' ? 'approved' : 'rejected', req.user.id, req.params.id);

  res.json({ success: true });
});

router.get('/users', authenticateToken, requireRole(['admin']), (req, res) => {
  const { page = 1, limit = 20, role, status } = req.query;
  const offset = (page - 1) * limit;

  let where = [];
  let params = [];

  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const users = db.prepare(`
    SELECT id, username, email, avatar, role, status, created_at, updated_at
    FROM users ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params);

  res.json({
    users,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.put('/users/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const { role, status } = req.body;

  db.prepare(`
    UPDATE users SET
      role = COALESCE(?, role),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(role, status, req.params.id);

  const user = db.prepare('SELECT id, username, email, role, status FROM users WHERE id = ?').get(req.params.id);
  res.json({ user });
});

router.get('/moderation-logs', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const logs = db.prepare(`
    SELECT ml.*, u.username as moderator_name
    FROM moderation_logs ml
    JOIN users u ON ml.moderator_id = u.id
    ORDER BY ml.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(limit), offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM moderation_logs').get();

  res.json({
    logs,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/video-sources', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const { page = 1, limit = 20, copyright_status } = req.query;
  const offset = (page - 1) * limit;

  let where = [];
  let params = [];

  if (copyright_status) {
    where.push('copyright_status = ?');
    params.push(copyright_status);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const sources = db.prepare(`
    SELECT vs.*,
      CASE WHEN vs.content_type = 'movie' THEN m.title ELSE t.title END as content_title
    FROM video_sources vs
    LEFT JOIN movies m ON vs.content_type = 'movie' AND vs.content_id = m.id
    LEFT JOIN tv_shows t ON vs.content_type = 'tv' AND vs.content_id = t.id
    ${whereClause}
    ORDER BY vs.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM video_sources ${whereClause}`).get(...params);

  res.json({
    sources,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.put('/video-sources/:id/verify', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const { copyright_status, note } = req.body;

  if (!['verified', 'rejected', 'pending'].includes(copyright_status)) {
    return res.status(400).json({ error: '无效的版权状态' });
  }

  db.prepare(`
    UPDATE video_sources SET
      copyright_status = ?,
      is_official = ?
    WHERE id = ?
  `).run(copyright_status, copyright_status === 'verified' ? 1 : 0, req.params.id);

  const source = db.prepare('SELECT * FROM video_sources WHERE id = ?').get(req.params.id);
  res.json({ source });
});

module.exports = router;
