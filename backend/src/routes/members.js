const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/notes', authenticateToken, (req, res) => {
  const { plan_id, chapter_id, is_public } = req.query;
  
  let query = `
    SELECT n.*, u.name as author_name, c.title as chapter_title
    FROM notes n
    JOIN users u ON n.user_id = u.id
    LEFT JOIN chapters c ON n.chapter_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (plan_id) {
    query += ' AND n.plan_id = ?';
    params.push(plan_id);
  }
  if (chapter_id) {
    query += ' AND n.chapter_id = ?';
    params.push(chapter_id);
  }

  query += ` AND (n.is_public = 1 OR n.user_id = ${req.user.id})`;
  query += ' ORDER BY n.created_at DESC';
  
  const notes = db.prepare(query).all(...params);
  res.json({ notes });
});

router.post('/notes', authenticateToken, (req, res) => {
  const { plan_id, chapter_id, type, content, excerpt, page_number, is_public } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO notes (user_id, plan_id, chapter_id, type, content, excerpt, page_number, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(req.user.id, plan_id, chapter_id, type || 'note', content, excerpt, page_number, is_public ? 1 : 0);

  res.json({ id: result.lastInsertRowid, message: 'Note created successfully' });
});

router.get('/progress', authenticateToken, (req, res) => {
  const { plan_id, all_members } = req.query;
  
  let query = `
    SELECT rp.*, c.title as chapter_title, c.chapter_number, u.name as user_name
    FROM reading_progress rp
    JOIN chapters c ON rp.chapter_id = c.id
    JOIN users u ON rp.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (plan_id) {
    query += ' AND rp.plan_id = ?';
    params.push(plan_id);
  }

  if (all_members !== '1' || !['admin', 'host'].includes(req.user.role)) {
    query += ' AND rp.user_id = ?';
    params.push(req.user.id);
  }

  const progress = db.prepare(query).all(...params);
  res.json({ progress });
});

router.post('/progress', authenticateToken, (req, res) => {
  const { plan_id, chapter_id, status } = req.body;
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO reading_progress (user_id, plan_id, chapter_id, status, completed_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  stmt.run(req.user.id, plan_id, chapter_id, status || 'in_progress', completedAt);

  res.json({ message: 'Progress updated successfully' });
});

router.get('/check-ins', authenticateToken, (req, res) => {
  const { plan_id } = req.query;
  
  let query = `
    SELECT ci.*, u.name as user_name, c.title as chapter_title
    FROM check_ins ci
    JOIN users u ON ci.user_id = u.id
    JOIN chapters c ON ci.chapter_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (plan_id) {
    query += ' AND ci.plan_id = ?';
    params.push(plan_id);
  }

  query += ' ORDER BY ci.created_at DESC';
  
  const checkIns = db.prepare(query).all(...params);
  res.json({ check_ins: checkIns });
});

router.post('/check-ins', authenticateToken, (req, res) => {
  const { plan_id, chapter_id, note } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO check_ins (user_id, plan_id, chapter_id, note)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(req.user.id, plan_id, chapter_id, note);

  res.json({ id: result.lastInsertRowid, message: 'Check-in recorded successfully' });
});

router.put('/notes/:id', authenticateToken, (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  if (note.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { content, excerpt, page_number, is_public } = req.body;
  db.prepare(`
    UPDATE notes 
    SET content = ?, excerpt = ?, page_number = ?, is_public = ?
    WHERE id = ?
  `).run(content, excerpt, page_number, is_public ? 1 : 0, req.params.id);

  res.json({ message: 'Note updated successfully' });
});

router.delete('/notes/:id', authenticateToken, (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  if (note.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Note deleted successfully' });
});

module.exports = router;
