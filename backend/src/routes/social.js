const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/clubs', authenticateToken, (req, res) => {
  const clubs = db.prepare(`
    SELECT c.*, u.username as owner_name 
    FROM clubs c
    JOIN users u ON c.owner_id = u.id
    ORDER BY c.member_count DESC
  `).all();

  res.json({ clubs });
});

router.post('/clubs', authenticateToken, (req, res) => {
  const { name, description, logo } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Club name is required' });
  }

  const existing = db.prepare('SELECT id FROM clubs WHERE name = ?').get(name);
  if (existing) {
    return res.status(400).json({ error: 'Club name already exists' });
  }

  const result = db.prepare(`
    INSERT INTO clubs (name, description, logo, owner_id, member_count)
    VALUES (?, ?, ?, ?, 1)
  `).run(name, description || null, logo || null, req.user.id);

  db.prepare(`
    INSERT INTO club_members (club_id, user_id, role)
    VALUES (?, ?, 'owner')
  `).run(result.lastInsertRowid, req.user.id);

  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ club });
});

router.get('/clubs/:id', authenticateToken, (req, res) => {
  const club = db.prepare(`
    SELECT c.*, u.username as owner_name 
    FROM clubs c
    JOIN users u ON c.owner_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!club) {
    return res.status(404).json({ error: 'Club not found' });
  }

  const isMember = db.prepare('SELECT id FROM club_members WHERE club_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  club.is_member = !!isMember;

  const members = db.prepare(`
    SELECT cm.*, u.username, u.nickname, u.avatar 
    FROM club_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.club_id = ?
    ORDER BY cm.joined_at ASC
  `).all(req.params.id);

  club.members = members;
  res.json({ club });
});

router.post('/clubs/:id/join', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT id FROM club_members WHERE club_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) {
    return res.status(400).json({ error: 'Already a member' });
  }

  db.prepare('INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)')
    .run(req.params.id, req.user.id, 'member');
  
  db.prepare('UPDATE clubs SET member_count = member_count + 1 WHERE id = ?').run(req.params.id);

  res.json({ status: 'ok' });
});

router.post('/clubs/:id/leave', authenticateToken, (req, res) => {
  const member = db.prepare('SELECT * FROM club_members WHERE club_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member) {
    return res.status(400).json({ error: 'Not a member' });
  }

  if (member.role === 'owner') {
    return res.status(400).json({ error: 'Owner cannot leave the club' });
  }

  db.prepare('DELETE FROM club_members WHERE club_id = ? AND user_id = ?').run(req.params.id, req.user.id);
  db.prepare('UPDATE clubs SET member_count = member_count - 1 WHERE id = ?').run(req.params.id);

  res.json({ status: 'ok' });
});

router.get('/events', authenticateToken, (req, res) => {
  const { club_id, status } = req.query;
  
  let query = `
    SELECT e.*, c.name as club_name, u.username as creator_name,
      (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id) as participant_count
    FROM events e
    JOIN clubs c ON e.club_id = c.id
    JOIN users u ON e.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (club_id) {
    query += ' AND e.club_id = ?';
    params.push(club_id);
  }
  if (status) {
    query += ' AND e.status = ?';
    params.push(status);
  }

  query += ' ORDER BY e.start_time DESC';
  const events = db.prepare(query).all(...params);

  res.json({ events });
});

router.post('/events', authenticateToken, (req, res) => {
  const { club_id, title, description, start_time, end_time, location, route_data, max_participants } = req.body;

  if (!club_id || !title || !start_time) {
    return res.status(400).json({ error: 'Club ID, title and start time are required' });
  }

  const isOwner = db.prepare(`
    SELECT id FROM club_members WHERE club_id = ? AND user_id = ? AND role = 'owner'
  `).get(club_id, req.user.id);

  if (!isOwner) {
    return res.status(403).json({ error: 'Only club owner can create events' });
  }

  const result = db.prepare(`
    INSERT INTO events (club_id, title, description, start_time, end_time, location, route_data, max_participants, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)
  `).run(club_id, title, description || null, start_time, end_time || null, location || null, 
         route_data ? JSON.stringify(route_data) : null, max_participants || null, req.user.id);

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ event });
});

router.post('/events/:id/register', authenticateToken, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (event.status !== 'upcoming') {
    return res.status(400).json({ error: 'Cannot register for this event' });
  }

  const existing = db.prepare('SELECT id FROM event_participants WHERE event_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) {
    return res.status(400).json({ error: 'Already registered' });
  }

  if (event.max_participants) {
    const count = db.prepare('SELECT COUNT(*) as count FROM event_participants WHERE event_id = ?').get(req.params.id).count;
    if (count >= event.max_participants) {
      return res.status(400).json({ error: 'Event is full' });
    }
  }

  db.prepare('INSERT INTO event_participants (event_id, user_id, status) VALUES (?, ?, ?)')
    .run(req.params.id, req.user.id, 'registered');

  res.json({ status: 'ok' });
});

router.get('/shared-routes', authenticateToken, (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;

  const routes = db.prepare(`
    SELECT sr.*, u.username, u.nickname, u.avatar
    FROM shared_routes sr
    JOIN users u ON sr.user_id = u.id
    WHERE sr.is_public = 1
    ORDER BY sr.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(page_size), parseInt(offset));

  const total = db.prepare('SELECT COUNT(*) as count FROM shared_routes WHERE is_public = 1').get().count;

  res.json({ routes, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.post('/shared-routes', authenticateToken, (req, res) => {
  const { ride_id, title, description, route_data, elevation_data, distance, is_public } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = db.prepare(`
    INSERT INTO shared_routes (user_id, ride_id, title, description, route_data, elevation_data, distance, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, ride_id || null, title, description || null, 
         route_data ? JSON.stringify(route_data) : null,
         elevation_data ? JSON.stringify(elevation_data) : null,
         distance || 0, is_public !== undefined ? (is_public ? 1 : 0) : 1);

  const route = db.prepare('SELECT * FROM shared_routes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ route });
});

router.get('/shared-routes/:id', authenticateToken, (req, res) => {
  const route = db.prepare(`
    SELECT sr.*, u.username, u.nickname, u.avatar
    FROM shared_routes sr
    JOIN users u ON sr.user_id = u.id
    WHERE sr.id = ?
  `).get(req.params.id);

  if (!route) {
    return res.status(404).json({ error: 'Route not found' });
  }

  if (route.route_data) {
    route.route_data = JSON.parse(route.route_data);
  }
  if (route.elevation_data) {
    route.elevation_data = JSON.parse(route.elevation_data);
  }

  db.prepare('UPDATE shared_routes SET views = views + 1 WHERE id = ?').run(req.params.id);

  res.json({ route });
});

router.get('/topics', authenticateToken, (req, res) => {
  const { page = 1, page_size = 20, city, status } = req.query;
  const offset = (page - 1) * page_size;

  let query = `
    SELECT t.*, u.username, u.nickname, u.avatar
    FROM topics t
    JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (city) {
    query += ' AND t.city = ?';
    params.push(city);
  }
  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  } else {
    query += " AND t.status = 'approved'";
  }

  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), parseInt(offset));

  const topics = db.prepare(query).all(...params);

  res.json({ topics, page: parseInt(page), page_size: parseInt(page_size) });
});

router.post('/topics', authenticateToken, (req, res) => {
  const { title, content, images, city } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = db.prepare(`
    INSERT INTO topics (user_id, title, content, images, city, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(req.user.id, title, content || null, 
         images ? JSON.stringify(images) : null, city || null);

  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ topic, message: 'Topic submitted for review' });
});

router.get('/topics/:id', authenticateToken, (req, res) => {
  const topic = db.prepare(`
    SELECT t.*, u.username, u.nickname, u.avatar
    FROM topics t
    JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }

  if (topic.images) {
    topic.images = JSON.parse(topic.images);
  }

  const comments = db.prepare(`
    SELECT tc.*, u.username, u.nickname, u.avatar
    FROM topic_comments tc
    JOIN users u ON tc.user_id = u.id
    WHERE tc.topic_id = ?
    ORDER BY tc.created_at ASC
  `).all(req.params.id);

  db.prepare('UPDATE topics SET views = views + 1 WHERE id = ?').run(req.params.id);

  res.json({ topic, comments });
});

router.post('/topics/:id/comments', authenticateToken, (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  db.prepare(`
    INSERT INTO topic_comments (topic_id, user_id, content)
    VALUES (?, ?, ?)
  `).run(req.params.id, req.user.id, content);

  res.status(201).json({ status: 'ok' });
});

module.exports = router;
