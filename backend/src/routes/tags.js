const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const tags = db.prepare(`
      SELECT t.*, COUNT(DISTINCT tt.task_id) as task_count
      FROM tags t
      LEFT JOIN task_tags tt ON t.id = tt.tag_id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.name ASC
    `).all(req.user.id);
    
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { name, color } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO tags (user_id, name, color)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(req.user.id, name, color || '#9E9E9E');
    
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(tag);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Tag already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, color } = req.body;
  
  try {
    const tag = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    db.prepare(`
      UPDATE tags SET name = ?, color = ? WHERE id = ? AND user_id = ?
    `).run(name || tag.name, color || tag.color, req.params.id, req.user.id);
    
    const updated = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const tag = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
