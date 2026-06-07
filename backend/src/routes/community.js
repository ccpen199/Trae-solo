const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/posts', (req, res) => {
  try {
    const { type, author_id, search } = req.query;
    let sql = `SELECT cp.*, u.name AS author_name
      FROM community_posts cp
      JOIN users u ON cp.author_id = u.id
      WHERE 1=1`;
    const params = [];
    if (type) {
      sql += ` AND cp.type = ?`;
      params.push(type);
    }
    if (author_id) {
      sql += ` AND cp.author_id = ?`;
      params.push(author_id);
    }
    if (search) {
      sql += ` AND cp.title LIKE ?`;
      params.push(`%${search}%`);
    }
    sql += ` ORDER BY cp.created_at DESC`;
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts', (req, res) => {
  try {
    const { author_id, type, title, content, tags } = req.body;
    const result = db.prepare(
      `INSERT INTO community_posts (author_id, type, title, content, tags)
       VALUES (?, ?, ?, ?, ?)`
    ).run(author_id, type, title, content, tags ? JSON.stringify(tags) : '[]');
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/posts/:id', (req, res) => {
  try {
    db.prepare(
      `UPDATE community_posts SET view_count = view_count + 1 WHERE id = ?`
    ).run(req.params.id);

    const row = db.prepare(
      `SELECT cp.*, u.name AS author_name
       FROM community_posts cp
       JOIN users u ON cp.author_id = u.id
       WHERE cp.id = ?`
    ).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/posts/:id', (req, res) => {
  try {
    const { type, title, content, tags } = req.body;
    const result = db.prepare(
      `UPDATE community_posts SET type = COALESCE(?, type), title = COALESCE(?, title), content = COALESCE(?, content), tags = COALESCE(?, tags), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(type, title, content, tags ? JSON.stringify(tags) : null, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts/:id/like', (req, res) => {
  try {
    const result = db.prepare(
      `UPDATE community_posts SET like_count = like_count + 1 WHERE id = ?`
    ).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
