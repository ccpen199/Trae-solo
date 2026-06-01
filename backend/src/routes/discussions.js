const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/topics', authenticateToken, (req, res) => {
  const { plan_id, chapter_id, is_essence } = req.query;
  
  let query = `
    SELECT dt.*, u.name as author_name,
           (SELECT COUNT(*) FROM discussion_comments WHERE topic_id = dt.id) as comment_count,
           (SELECT COUNT(*) FROM votes WHERE topic_id = dt.id) as vote_count
    FROM discussion_topics dt
    JOIN users u ON dt.author_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (plan_id) {
    query += ' AND dt.plan_id = ?';
    params.push(plan_id);
  }
  if (chapter_id) {
    query += ' AND dt.chapter_id = ?';
    params.push(chapter_id);
  }
  if (is_essence === '1') {
    query += ' AND dt.is_essence = 1';
  }

  query += ' ORDER BY dt.is_pinned DESC, dt.created_at DESC';
  
  const topics = db.prepare(query).all(...params);
  res.json({ topics });
});

router.get('/topics/:id', authenticateToken, (req, res) => {
  const topic = db.prepare(`
    SELECT dt.*, u.name as author_name
    FROM discussion_topics dt
    JOIN users u ON dt.author_id = u.id
    WHERE dt.id = ?
  `).get(req.params.id);

  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }

  db.prepare('UPDATE discussion_topics SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

  const comments = db.prepare(`
    SELECT dc.*, u.name as author_name
    FROM discussion_comments dc
    JOIN users u ON dc.author_id = u.id
    WHERE dc.topic_id = ?
    ORDER BY dc.created_at ASC
  `).all(req.params.id);

  const userVote = db.prepare('SELECT vote_type FROM votes WHERE topic_id = ? AND user_id = ?').get(req.params.id, req.user.id);

  res.json({ topic, comments, user_vote: userVote || null });
});

router.post('/topics', authenticateToken, (req, res) => {
  const { plan_id, chapter_id, title, content } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO discussion_topics (plan_id, chapter_id, author_id, title, content)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(plan_id, chapter_id, req.user.id, title, content);

  res.json({ id: result.lastInsertRowid, message: 'Topic created successfully' });
});

router.post('/topics/:id/comments', authenticateToken, (req, res) => {
  const { content, parent_id } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO discussion_comments (topic_id, author_id, content, parent_id)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(req.params.id, req.user.id, content, parent_id || null);

  res.json({ id: result.lastInsertRowid, message: 'Comment posted successfully' });
});

router.post('/topics/:id/vote', authenticateToken, (req, res) => {
  const { vote_type } = req.body;
  
  const existing = db.prepare('SELECT id FROM votes WHERE topic_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  
  if (existing) {
    db.prepare('DELETE FROM votes WHERE id = ?').run(existing.id);
    res.json({ message: 'Vote removed', voted: false });
  } else {
    db.prepare('INSERT INTO votes (topic_id, user_id, vote_type) VALUES (?, ?, ?)').run(req.params.id, req.user.id, vote_type || 1);
    res.json({ message: 'Vote recorded', voted: true });
  }
});

router.put('/topics/:id/pin', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  const { is_pinned } = req.body;
  db.prepare('UPDATE discussion_topics SET is_pinned = ? WHERE id = ?').run(is_pinned ? 1 : 0, req.params.id);
  res.json({ message: 'Topic pin status updated' });
});

router.put('/topics/:id/essence', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  const { is_essence } = req.body;
  db.prepare('UPDATE discussion_topics SET is_essence = ? WHERE id = ?').run(is_essence ? 1 : 0, req.params.id);
  res.json({ message: 'Topic essence status updated' });
});

router.put('/comments/:id/essence', authenticateToken, requireRole('admin', 'host'), (req, res) => {
  const { is_essence } = req.body;
  db.prepare('UPDATE discussion_comments SET is_essence = ? WHERE id = ?').run(is_essence ? 1 : 0, req.params.id);
  res.json({ message: 'Comment essence status updated' });
});

router.delete('/topics/:id', authenticateToken, (req, res) => {
  const topic = db.prepare('SELECT * FROM discussion_topics WHERE id = ?').get(req.params.id);
  
  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }
  if (topic.author_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'host') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  db.prepare('DELETE FROM discussion_topics WHERE id = ?').run(req.params.id);
  res.json({ message: 'Topic deleted successfully' });
});

module.exports = router;
