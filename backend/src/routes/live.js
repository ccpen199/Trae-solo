const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole, logBehavior } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT lr.*, c.name as company_name, c.industry, u.username as hr_name, u.avatar as hr_avatar,
           COALESCE(lr.job_count, 0) as job_count
    FROM live_rooms lr
    JOIN companies c ON lr.company_id = c.id
    JOIN users u ON lr.hr_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND lr.status = ?';
    params.push(status);
  }

  const countParams = [...params];

  sql += ' ORDER BY lr.start_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const rooms = db.prepare(sql).all(...params);

  const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM').replace(/ORDER BY[\s\S]*$/, '');
  const { count = 0 } = db.prepare(countSql).get(...countParams) || {};

  res.json({ rooms, total: count });
});

router.post('/', authenticateToken, requireRole('hr'), logBehavior('create_live', 'live'), (req, res) => {
  const company = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(req.user.id);
  if (!company) {
    return res.status(404).json({ error: 'Company profile not found' });
  }

  const { title, description, cover_image, stream_url, start_time } = req.body;

  if (!title || !start_time) {
    return res.status(400).json({ error: 'Title and start time are required' });
  }

  const result = db.prepare(`
    INSERT INTO live_rooms (company_id, hr_id, title, description, cover_image, stream_url, start_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(company.id, req.user.id, title, description, cover_image, stream_url, start_time);

  res.json({ id: result.lastInsertRowid, message: 'Live room created successfully' });
});

router.get('/:id', (req, res) => {
  const room = db.prepare(`
    SELECT lr.*, c.name as company_name, c.industry, c.scale, c.description as company_description,
           u.username as hr_name, u.avatar as hr_avatar
    FROM live_rooms lr
    JOIN companies c ON lr.company_id = c.id
    JOIN users u ON lr.hr_id = u.id
    WHERE lr.id = ?
  `).get(req.params.id);

  if (!room) {
    return res.status(404).json({ error: 'Live room not found' });
  }

  const jobs = db.prepare(`
    SELECT j.* FROM jobs j
    WHERE j.company_id = ? AND j.is_active = 1
    ORDER BY j.created_at DESC
    LIMIT 5
  `).all(room.company_id);

  jobs.forEach(j => {
    if (j.requirements) j.requirements = JSON.parse(j.requirements);
  });

  res.json({ room, related_jobs: jobs });
});

router.put('/:id/status', authenticateToken, requireRole('hr'), (req, res) => {
  const roomId = req.params.id;
  const { status } = req.body;

  const room = db.prepare('SELECT * FROM live_rooms WHERE id = ? AND hr_id = ?').get(roomId, req.user.id);
  if (!room) {
    return res.status(404).json({ error: 'Live room not found' });
  }

  db.prepare('UPDATE live_rooms SET status = ? WHERE id = ?').run(status, roomId);

  if (status === 'live') {
    db.prepare('UPDATE live_rooms SET start_time = CURRENT_TIMESTAMP WHERE id = ?').run(roomId);
  } else if (status === 'ended') {
    db.prepare('UPDATE live_rooms SET end_time = CURRENT_TIMESTAMP WHERE id = ?').run(roomId);
  }

  res.json({ message: 'Live room status updated' });
});

router.post('/:id/danmaku', authenticateToken, (req, res) => {
  const roomId = req.params.id;
  const { content } = req.body;

  if (!content || content.length > 50) {
    return res.status(400).json({ error: 'Invalid content' });
  }

  const result = db.prepare(`
    INSERT INTO live_danmakus (live_room_id, user_id, content)
    VALUES (?, ?, ?)
  `).run(roomId, req.user.id, content);

  const io = require('../app').io;
  io.to(`live_${roomId}`).emit('danmaku', {
    id: result.lastInsertRowid,
    user_id: req.user.id,
    username: req.user.username,
    content,
    created_at: new Date().toISOString()
  });

  res.json({ id: result.lastInsertRowid });
});

router.get('/:id/danmakus', (req, res) => {
  const { limit = 50 } = req.query;
  const danmakus = db.prepare(`
    SELECT ld.*, u.username, u.avatar
    FROM live_danmakus ld
    JOIN users u ON ld.user_id = u.id
    WHERE ld.live_room_id = ?
    ORDER BY ld.created_at DESC
    LIMIT ?
  `).all(req.params.id, parseInt(limit)).reverse();

  res.json({ danmakus });
});

router.post('/:id/view', (req, res) => {
  db.prepare('UPDATE live_rooms SET viewer_count = viewer_count + 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'View count updated' });
});

module.exports = router;
