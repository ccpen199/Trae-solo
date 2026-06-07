const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/pairs', (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT ma.*,
        u1.name AS mentor_name, u2.name AS apprentice_name,
        t1.skill_tags AS mentor_skills, t1.certification_level AS mentor_level,
        t2.skill_tags AS apprentice_skills, t2.certification_level AS apprentice_level
       FROM mentor_apprentice ma
       JOIN technicians t1 ON ma.mentor_id = t1.id
       JOIN users u1 ON t1.user_id = u1.id
       JOIN technicians t2 ON ma.apprentice_id = t2.id
       JOIN users u2 ON t2.user_id = u2.id
       ORDER BY ma.created_at DESC`
    ).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pairs', (req, res) => {
  try {
    const { mentor_id, apprentice_id } = req.body;
    const result = db.prepare(
      `INSERT INTO mentor_apprentice (mentor_id, apprentice_id) VALUES (?, ?)`
    ).run(mentor_id, apprentice_id);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/pairs/:id', (req, res) => {
  try {
    const { status } = req.body;
    const result = db.prepare(
      `UPDATE mentor_apprentice SET status = ? WHERE id = ?`
    ).run(status, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tasks', (req, res) => {
  try {
    const { status, mentor_apprentice_id } = req.query;
    let sql = `SELECT mt.*,
      ma.mentor_id, ma.apprentice_id AS pair_apprentice_id,
      u1.name AS mentor_name, u2.name AS apprentice_name
      FROM mentor_tasks mt
      JOIN mentor_apprentice ma ON mt.mentor_apprentice_id = ma.id
      JOIN technicians t1 ON ma.mentor_id = t1.id
      JOIN users u1 ON t1.user_id = u1.id
      LEFT JOIN technicians t2 ON mt.apprentice_id = t2.id
      LEFT JOIN users u2 ON t2.user_id = u2.id
      WHERE 1=1`;
    const params = [];
    if (status) {
      sql += ` AND mt.status = ?`;
      params.push(status);
    }
    if (mentor_apprentice_id) {
      sql += ` AND mt.mentor_apprentice_id = ?`;
      params.push(mentor_apprentice_id);
    }
    sql += ` ORDER BY mt.created_at DESC`;
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tasks', (req, res) => {
  try {
    const { mentor_apprentice_id, title, description } = req.body;
    const result = db.prepare(
      `INSERT INTO mentor_tasks (mentor_apprentice_id, title, description) VALUES (?, ?, ?)`
    ).run(mentor_apprentice_id, title, description);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tasks/:id/accept', (req, res) => {
  try {
    const { apprentice_id } = req.body;
    const result = db.prepare(
      `UPDATE mentor_tasks SET apprentice_id = ?, status = 'accepted', accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(apprentice_id, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tasks/:id/guide', (req, res) => {
  try {
    const { mentor_guidance } = req.body;
    const result = db.prepare(
      `UPDATE mentor_tasks SET mentor_guidance = ?, status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(mentor_guidance, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tasks/:id/complete', (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const result = db.prepare(
      `UPDATE mentor_tasks SET status = 'completed', rating = ?, feedback = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(rating, feedback, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
