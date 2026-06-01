const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { plan_id, type } = req.query;
  
  let query = `
    SELECT a.*, u.name as host_name, bp.title as plan_title,
           (SELECT COUNT(*) FROM activity_attendees WHERE activity_id = a.id) as attendee_count
    FROM activities a
    LEFT JOIN users u ON a.host_id = u.id
    LEFT JOIN book_plans bp ON a.plan_id = bp.id
    WHERE 1=1
  `;
  const params = [];

  if (plan_id) {
    query += ' AND a.plan_id = ?';
    params.push(plan_id);
  }
  if (type) {
    query += ' AND a.type = ?';
    params.push(type);
  }

  query += ' ORDER BY a.scheduled_at DESC';
  
  const activities = db.prepare(query).all(...params);
  res.json({ activities });
});

router.get('/:id', authenticateToken, (req, res) => {
  const activity = db.prepare(`
    SELECT a.*, u.name as host_name
    FROM activities a
    LEFT JOIN users u ON a.host_id = u.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  const attendees = db.prepare(`
    SELECT aa.*, u.name, u.email
    FROM activity_attendees aa
    JOIN users u ON aa.user_id = u.id
    WHERE aa.activity_id = ?
  `).all(req.params.id);

  const assignments = db.prepare(`
    SELECT ass.*, u.name as user_name
    FROM assignments ass
    JOIN users u ON ass.user_id = u.id
    WHERE ass.activity_id = ?
    ORDER BY ass.submitted_at DESC
  `).all(req.params.id);

  const userRegistered = db.prepare('SELECT id FROM activity_attendees WHERE activity_id = ? AND user_id = ?').get(req.params.id, req.user.id);

  res.json({ activity, attendees, assignments, user_registered: !!userRegistered });
});

router.post('/', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  const { 
    plan_id, title, type, description, scheduled_at, guest_info, 
    meeting_link, replay_link, materials, location,
    has_assignment, assignment_title, assignment_due_date, assignment_description
  } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO activities (
      plan_id, title, type, description, scheduled_at, host_id, guest_info, 
      meeting_link, replay_link, materials, location,
      has_assignment, assignment_title, assignment_due_date, assignment_description
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    plan_id, title, type, description, scheduled_at, req.user.id, guest_info, 
    meeting_link, replay_link, materials, location,
    has_assignment ? 1 : 0, assignment_title, assignment_due_date, assignment_description
  );

  res.json({ id: result.lastInsertRowid, message: 'Activity created successfully' });
});

router.post('/:id/register', authenticateToken, (req, res) => {
  const activityId = req.params.id;
  const userId = req.user.id;

  const existing = db.prepare('SELECT id FROM activity_attendees WHERE activity_id = ? AND user_id = ?').get(activityId, userId);
  if (existing) {
    return res.status(400).json({ error: 'Already registered' });
  }

  db.prepare('INSERT INTO activity_attendees (activity_id, user_id) VALUES (?, ?)').run(activityId, userId);
  res.json({ message: 'Registered successfully' });
});

router.post('/:id/assignments', authenticateToken, (req, res) => {
  const { content, file_url } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO assignments (activity_id, user_id, content, file_url)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(req.params.id, req.user.id, content, file_url);

  res.json({ id: result.lastInsertRowid, message: 'Assignment submitted successfully' });
});

router.put('/:id', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  const { 
    title, type, description, scheduled_at, guest_info, meeting_link, replay_link, 
    materials, status, location, has_assignment, assignment_title, 
    assignment_due_date, assignment_description, is_completed
  } = req.body;
  
  db.prepare(`
    UPDATE activities 
    SET title = ?, type = ?, description = ?, scheduled_at = ?, 
        guest_info = ?, meeting_link = ?, replay_link = ?, materials = ?, 
        status = ?, location = ?, has_assignment = ?, assignment_title = ?,
        assignment_due_date = ?, assignment_description = ?, is_completed = ?
    WHERE id = ?
  `).run(
    title, type, description, scheduled_at, guest_info, meeting_link, replay_link, 
    materials, status, location, has_assignment ? 1 : 0, assignment_title,
    assignment_due_date, assignment_description, is_completed ? 1 : 0, req.params.id
  );

  res.json({ message: 'Activity updated successfully' });
});

router.put('/:id/attendees/:user_id', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  const { status, attended } = req.body;
  const attendedAt = attended ? new Date().toISOString() : null;
  
  db.prepare(`
    UPDATE activity_attendees 
    SET status = ?, attended_at = ?
    WHERE activity_id = ? AND user_id = ?
  `).run(status || 'registered', attendedAt, req.params.id, req.params.user_id);

  res.json({ message: 'Attendee status updated' });
});

router.delete('/:id', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  res.json({ message: 'Activity deleted successfully' });
});

module.exports = router;
