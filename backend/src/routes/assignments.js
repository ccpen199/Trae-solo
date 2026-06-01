const express = require('express');
const { all, get, run } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    let assignments;
    if (req.user.role === 'student') {
      assignments = await all(`
        SELECT a.*, u.name as creator_name,
               (SELECT MAX(version) FROM submissions s WHERE s.assignment_id = a.id AND s.user_id = ?) as last_version
        FROM assignments a
        JOIN users u ON a.created_by = u.id
        ORDER BY a.created_at DESC
      `, [req.user.id]);
    } else {
      assignments = await all(`
        SELECT a.*, u.name as creator_name,
               (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submission_count
        FROM assignments a
        JOIN users u ON a.created_by = u.id
        ORDER BY a.created_at DESC
      `);
    }
    res.json({ assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const assignment = await get(`
      SELECT a.*, u.name as creator_name
      FROM assignments a
      JOIN users u ON a.created_by = u.id
      WHERE a.id = ?
    `, [req.params.id]);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    res.json({ assignment });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, requireRole('teacher', 'assistant'), async (req, res) => {
  try {
    const { title, description, submit_format, deadline, similarity_threshold, allow_resubmit, plagiarism_scope } = req.body;
    
    const result = await run(`
      INSERT INTO assignments (title, description, submit_format, deadline, similarity_threshold, allow_resubmit, plagiarism_scope, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description, submit_format, deadline, similarity_threshold || 80, allow_resubmit ? 1 : 0, plagiarism_scope || 'all', req.user.id]);
    
    const assignment = await get('SELECT * FROM assignments WHERE id = ?', [result.lastID]);
    res.status(201).json({ assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticate, requireRole('teacher', 'assistant'), async (req, res) => {
  try {
    const { title, description, submit_format, deadline, similarity_threshold, allow_resubmit, plagiarism_scope } = req.body;
    
    await run(`
      UPDATE assignments 
      SET title = ?, description = ?, submit_format = ?, deadline = ?, similarity_threshold = ?, allow_resubmit = ?, plagiarism_scope = ?
      WHERE id = ? AND created_by = ?
    `, [title, description, submit_format, deadline, similarity_threshold, allow_resubmit ? 1 : 0, plagiarism_scope, req.params.id, req.user.id]);
    
    const assignment = await get('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    res.json({ assignment });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    await run('DELETE FROM assignments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
