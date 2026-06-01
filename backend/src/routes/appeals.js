const express = require('express');
const { all, get, run } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    let appeals;
    
    if (req.user.role === 'student') {
      appeals = await all(`
        SELECT a.*, s.assignment_id, a_t.title as assignment_title, s.version as submission_version
        FROM appeals a
        JOIN submissions s ON a.submission_id = s.id
        JOIN assignments a_t ON s.assignment_id = a_t.id
        WHERE a.student_id = ?
        ORDER BY a.created_at DESC
      `, [req.user.id]);
    } else {
      appeals = await all(`
        SELECT a.*, 
               s.assignment_id, a_t.title as assignment_title, 
               s.version as submission_version,
               u.name as student_name, u.username as student_username,
               r.name as reviewer_name
        FROM appeals a
        JOIN submissions s ON a.submission_id = s.id
        JOIN assignments a_t ON s.assignment_id = a_t.id
        JOIN users u ON a.student_id = u.id
        LEFT JOIN users r ON a.reviewed_by = r.id
        ORDER BY a.created_at DESC
      `);
    }
    
    res.json({ appeals });
  } catch (error) {
    console.error('Get appeals error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const appeal = await get(`
      SELECT a.*, 
             s.assignment_id, a_t.title as assignment_title, 
             s.version as submission_version, s.file_name as submission_file,
             u.name as student_name, u.username as student_username,
             r.name as reviewer_name
      FROM appeals a
      JOIN submissions s ON a.submission_id = s.id
      JOIN assignments a_t ON s.assignment_id = a_t.id
      JOIN users u ON a.student_id = u.id
      LEFT JOIN users r ON a.reviewed_by = r.id
      WHERE a.id = ?
    `, [req.params.id]);
    
    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }
    
    if (req.user.role === 'student' && appeal.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ appeal });
  } catch (error) {
    console.error('Get appeal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { submissionId, reason } = req.body;
    
    if (!submissionId || !reason) {
      return res.status(400).json({ error: 'Submission ID and reason are required' });
    }
    
    const submission = await get('SELECT * FROM submissions WHERE id = ? AND user_id = ?', [submissionId, req.user.id]);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const existingAppeal = await get('SELECT * FROM appeals WHERE submission_id = ? AND student_id = ? AND status = "pending"', [submissionId, req.user.id]);
    if (existingAppeal) {
      return res.status(400).json({ error: 'There is already a pending appeal for this submission' });
    }
    
    const result = await run(`
      INSERT INTO appeals (submission_id, student_id, reason, status)
      VALUES (?, ?, ?, 'pending')
    `, [submissionId, req.user.id, reason]);
    
    const appeal = await get('SELECT * FROM appeals WHERE id = ?', [result.lastID]);
    res.status(201).json({ appeal });
  } catch (error) {
    console.error('Create appeal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/review', authenticate, requireRole('teacher', 'assistant'), async (req, res) => {
  try {
    const { status, teacherComment } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const appeal = await get('SELECT * FROM appeals WHERE id = ?', [req.params.id]);
    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }
    
    if (appeal.status !== 'pending') {
      return res.status(400).json({ error: 'This appeal has already been reviewed' });
    }
    
    await run(`
      UPDATE appeals 
      SET status = ?, teacher_comment = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, teacherComment, req.user.id, req.params.id]);
    
    if (status === 'approved') {
      await run('UPDATE submissions SET status = "appeal_approved" WHERE id = ?', [appeal.submission_id]);
    } else {
      await run('UPDATE submissions SET status = "appeal_rejected" WHERE id = ?', [appeal.submission_id]);
    }
    
    const updatedAppeal = await get('SELECT * FROM appeals WHERE id = ?', [req.params.id]);
    res.json({ appeal: updatedAppeal });
  } catch (error) {
    console.error('Review appeal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/plagiarism/:resultId/mark-citation', authenticate, requireRole('teacher', 'assistant'), async (req, res) => {
  try {
    const { isValidCitation } = req.body;
    
    await run(`
      UPDATE plagiarism_results 
      SET is_valid_citation = ?, marked_by = ?
      WHERE id = ?
    `, [isValidCitation ? 1 : 0, req.user.id, req.params.resultId]);
    
    const result = await get('SELECT * FROM plagiarism_results WHERE id = ?', [req.params.resultId]);
    res.json({ result });
  } catch (error) {
    console.error('Mark citation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
