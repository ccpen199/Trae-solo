const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  const { list_id, completed } = req.query;
  
  try {
    let query = `
      SELECT t.*, 
        (SELECT COUNT(*) FROM tasks st WHERE st.parent_id = t.id AND st.is_completed = 0) as subtodo_count,
        (SELECT COUNT(*) FROM tasks st WHERE st.parent_id = t.id) as total_subtodo_count,
        GROUP_CONCAT(DISTINCT ta.name) as tags
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      LEFT JOIN tags ta ON tt.tag_id = ta.id
      WHERE t.user_id = ? AND t.parent_id IS NULL
    `;
    const params = [req.user.id];
    
    if (list_id) {
      query += ' AND t.list_id = ?';
      params.push(list_id);
    }
    
    if (completed !== undefined) {
      query += ' AND t.is_completed = ?';
      params.push(completed === 'true' ? 1 : 0);
    }
    
    query += ' GROUP BY t.id ORDER BY t.order_index ASC, t.created_at DESC';
    
    const tasks = db.prepare(query).all(...params);
    
    tasks.forEach(task => {
      if (task.tags) {
        task.tags = task.tags.split(',');
      } else {
        task.tags = [];
      }
      
      const subtasks = db.prepare(`
        SELECT st.*, GROUP_CONCAT(ta.name) as tags
        FROM tasks st
        LEFT JOIN task_tags tt ON st.id = tt.task_id
        LEFT JOIN tags ta ON tt.tag_id = ta.id
        WHERE st.parent_id = ?
        GROUP BY st.id
        ORDER BY st.order_index ASC
      `).all(task.id);
      
      subtasks.forEach(st => {
        st.tags = st.tags ? st.tags.split(',') : [];
      });
      
      task.subtasks = subtasks;
    });
    
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const task = db.prepare(`
      SELECT t.*, GROUP_CONCAT(ta.name) as tags
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      LEFT JOIN tags ta ON tt.tag_id = ta.id
      WHERE t.id = ? AND t.user_id = ?
      GROUP BY t.id
    `).get(req.params.id, req.user.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.tags = task.tags ? task.tags.split(',') : [];
    
    const subtasks = db.prepare(`
      SELECT st.*, GROUP_CONCAT(ta.name) as tags
      FROM tasks st
      LEFT JOIN task_tags tt ON st.id = tt.task_id
      LEFT JOIN tags ta ON tt.tag_id = ta.id
      WHERE st.parent_id = ?
      GROUP BY st.id
      ORDER BY st.order_index ASC
    `).all(task.id);
    
    subtasks.forEach(st => {
      st.tags = st.tags ? st.tags.split(',') : [];
    });
    
    task.subtasks = subtasks;
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { title, description, list_id, priority, due_date, reminder, repeat_rule, parent_id, tags } = req.body;
  
  if (!title || !list_id) {
    return res.status(400).json({ error: 'Title and list_id required' });
  }

  try {
    const maxOrder = db.prepare('SELECT MAX(order_index) as max FROM tasks WHERE user_id = ? AND parent_id IS ?').get(req.user.id, parent_id || null);
    const orderIndex = (maxOrder.max || 0) + 1;
    
    const stmt = db.prepare(`
      INSERT INTO tasks (user_id, list_id, title, description, priority, due_date, reminder, repeat_rule, parent_id, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      req.user.id, list_id, title, description || null, 
      priority || 0, due_date || null, reminder || null, 
      repeat_rule || null, parent_id || null, orderIndex
    );
    
    if (tags && tags.length > 0) {
      const tagInsertStmt = db.prepare('INSERT OR IGNORE INTO tags (user_id, name) VALUES (?, ?)');
      const tagLinkStmt = db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)');
      
      tags.forEach(tagName => {
        tagInsertStmt.run(req.user.id, tagName);
        const tag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?').get(req.user.id, tagName);
        if (tag) {
          tagLinkStmt.run(result.lastInsertRowid, tag.id);
        }
      });
    }
    
    const task = db.prepare(`
      SELECT t.*, GROUP_CONCAT(ta.name) as tags
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      LEFT JOIN tags ta ON tt.tag_id = ta.id
      WHERE t.id = ?
      GROUP BY t.id
    `).get(result.lastInsertRowid);
    
    task.tags = task.tags ? task.tags.split(',') : [];
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { title, description, list_id, priority, due_date, reminder, repeat_rule, is_completed, tags } = req.body;
  
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, list_id = ?, priority = ?, due_date = ?, reminder = ?, 
          repeat_rule = ?, is_completed = ?, completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      title || task.title, description !== undefined ? description : task.description, 
      list_id || task.list_id, priority !== undefined ? priority : task.priority, 
      due_date !== undefined ? due_date : task.due_date, reminder !== undefined ? reminder : task.reminder, 
      repeat_rule !== undefined ? repeat_rule : task.repeat_rule, 
      is_completed !== undefined ? is_completed : task.is_completed,
      is_completed !== undefined ? is_completed : task.is_completed,
      req.params.id, req.user.id
    );
    
    if (tags) {
      db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(req.params.id);
      
      if (tags.length > 0) {
        const tagInsertStmt = db.prepare('INSERT OR IGNORE INTO tags (user_id, name) VALUES (?, ?)');
        const tagLinkStmt = db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)');
        
        tags.forEach(tagName => {
          tagInsertStmt.run(req.user.id, tagName);
          const tag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?').get(req.user.id, tagName);
          if (tag) {
            tagLinkStmt.run(req.params.id, tag.id);
          }
        });
      }
    }
    
    if (is_completed === 1 && task.parent_id) {
      const allSiblings = db.prepare('SELECT * FROM tasks WHERE parent_id = ?').all(task.parent_id);
      const allCompleted = allSiblings.every(s => s.is_completed === 1);
      
      if (allCompleted) {
        db.prepare('UPDATE tasks SET is_completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(task.parent_id);
      }
    }
    
    const updated = db.prepare(`
      SELECT t.*, GROUP_CONCAT(ta.name) as tags
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      LEFT JOIN tags ta ON tt.tag_id = ta.id
      WHERE t.id = ?
      GROUP BY t.id
    `).get(req.params.id);
    
    updated.tags = updated.tags ? updated.tags.split(',') : [];
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/move', (req, res) => {
  const { new_list_id } = req.body;
  
  try {
    db.prepare('UPDATE tasks SET list_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
      .run(new_list_id, req.params.id, req.user.id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
