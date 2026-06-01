const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query required' });
  }

  try {
    db.prepare('INSERT INTO search_history (user_id, query) VALUES (?, ?)').run(req.user.id, q);
    
    const tasks = db.prepare(`
      SELECT t.*, l.name as list_name, GROUP_CONCAT(ta.name) as tags
      FROM tasks t
      LEFT JOIN lists l ON t.list_id = l.id
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      LEFT JOIN tags ta ON tt.tag_id = ta.id
      WHERE t.user_id = ? AND (t.title LIKE ? OR t.description LIKE ?)
      GROUP BY t.id
      ORDER BY t.is_completed ASC, t.created_at DESC
    `).all(req.user.id, `%${q}%`, `%${q}%`);
    
    tasks.forEach(task => {
      task.tags = task.tags ? task.tags.split(',') : [];
    });
    
    const lists = db.prepare(`
      SELECT * FROM lists 
      WHERE user_id = ? AND name LIKE ?
      ORDER BY name ASC
    `).all(req.user.id, `%${q}%`);
    
    const tags = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? AND name LIKE ?
      ORDER BY name ASC
    `).all(req.user.id, `%${q}%`);
    
    res.json({ tasks, lists, tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', (req, res) => {
  try {
    const history = db.prepare(`
      SELECT DISTINCT query FROM search_history 
      WHERE user_id = ? 
      ORDER BY searched_at DESC 
      LIMIT 10
    `).all(req.user.id);
    
    res.json(history.map(h => h.query));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
