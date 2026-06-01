const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const plans = db.prepare(`
    SELECT bp.*, u.name as host_name,
           (SELECT COUNT(*) FROM plan_members WHERE plan_id = bp.id) as member_count
    FROM book_plans bp
    LEFT JOIN users u ON bp.host_id = u.id
    ORDER BY bp.created_at DESC
  `).all();
  res.json({ plans });
});

router.get('/:id', authenticateToken, (req, res) => {
  const plan = db.prepare(`
    SELECT bp.*, u.name as host_name
    FROM book_plans bp
    LEFT JOIN users u ON bp.host_id = u.id
    WHERE bp.id = ?
  `).get(req.params.id);

  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const chapters = db.prepare('SELECT * FROM chapters WHERE plan_id = ? ORDER BY chapter_number').all(req.params.id);

  const members = db.prepare(`
    SELECT pm.*, u.name, u.email, u.avatar
    FROM plan_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.plan_id = ?
  `).all(req.params.id);

  res.json({ plan, chapters, members });
});

router.post('/', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  const { title, book_title, book_author, description, start_date, end_date, reading_goals } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO book_plans (title, book_title, book_author, description, start_date, end_date, host_id, reading_goals)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(title, book_title, book_author, description, start_date, end_date, req.user.id, reading_goals);

  res.json({ id: result.lastInsertRowid, message: 'Plan created successfully' });
});

router.post('/:id/chapters', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  const { title, chapter_number, description, scheduled_date, pages } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO chapters (plan_id, title, chapter_number, description, scheduled_date, pages)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(req.params.id, title, chapter_number, description, scheduled_date, pages);

  res.json({ id: result.lastInsertRowid, message: 'Chapter added successfully' });
});

router.post('/:id/members', authenticateToken, (req, res) => {
  const planId = req.params.id;
  const userId = req.user.id;

  const existing = db.prepare('SELECT id FROM plan_members WHERE plan_id = ? AND user_id = ?').get(planId, userId);
  if (existing) {
    return res.status(400).json({ error: 'Already a member' });
  }

  db.prepare('INSERT INTO plan_members (plan_id, user_id) VALUES (?, ?)').run(planId, userId);
  res.json({ message: 'Joined plan successfully' });
});

router.put('/:id', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  const { title, book_title, book_author, description, start_date, end_date, reading_goals, status } = req.body;
  
  db.prepare(`
    UPDATE book_plans 
    SET title = ?, book_title = ?, book_author = ?, description = ?, 
        start_date = ?, end_date = ?, reading_goals = ?, status = ?
    WHERE id = ?
  `).run(title, book_title, book_author, description, start_date, end_date, reading_goals, status, req.params.id);

  res.json({ message: 'Plan updated successfully' });
});

module.exports = router;
