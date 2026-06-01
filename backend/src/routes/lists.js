const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const lists = db.prepare(`
      SELECT l.*, 
        (SELECT COUNT(*) FROM tasks t WHERE t.list_id = l.id AND t.is_completed = 0 AND t.parent_id IS NULL) as task_count
      FROM lists l
      WHERE l.user_id = ?
      ORDER BY l.is_default DESC, l.created_at ASC
    `).all(req.user.id);
    
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { name, color, icon } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO lists (user_id, name, color, icon)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(req.user.id, name, color || '#2196F3', icon || '📋');
    
    const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, color, icon } = req.body;
  
  try {
    const list = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }
    
    db.prepare(`
      UPDATE lists 
      SET name = ?, color = ?, icon = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(name || list.name, color || list.color, icon || list.icon, req.params.id, req.user.id);
    
    const updated = db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }
    
    if (list.is_default) {
      return res.status(400).json({ error: 'Cannot delete default list' });
    }
    
    db.prepare('DELETE FROM lists WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
