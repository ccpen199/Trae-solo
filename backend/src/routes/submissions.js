const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { all, get, run } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { parseFile, isSupportedFormat } = require('../services/fileParser');
const { calculateSimilarity, findSimilarSegments, checkCodeSimilarity, detectMatchedRules } = require('../services/plagiarismChecker');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/', authenticate, async (req, res) => {
  try {
    let submissions;
    if (req.user.role === 'student') {
      submissions = await all(`
        SELECT s.*, a.title as assignment_title,
               (SELECT MAX(similarity) FROM plagiarism_results pr WHERE pr.submission_id = s.id) as max_similarity
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE s.user_id = ?
        ORDER BY s.submit_time DESC
      `, [req.user.id]);
    } else {
      submissions = await all(`
        SELECT s.*, a.title as assignment_title, u.name as student_name, u.username as student_username,
               (SELECT MAX(similarity) FROM plagiarism_results pr WHERE pr.submission_id = s.id) as max_similarity
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        JOIN users u ON s.user_id = u.id
        ORDER BY s.submit_time DESC
      `);
    }
    res.json({ submissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/assignment/:assignmentId', authenticate, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    let submissions;
    
    if (req.user.role === 'student') {
      submissions = await all(`
        SELECT s.*, a.title as assignment_title,
               (SELECT MAX(similarity) FROM plagiarism_results pr WHERE pr.submission_id = s.id) as max_similarity
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE s.assignment_id = ? AND s.user_id = ?
        ORDER BY s.version DESC
      `, [assignmentId, req.user.id]);
    } else {
      submissions = await all(`
        SELECT s.*, a.title as assignment_title, u.name as student_name, u.username as student_username,
               (SELECT MAX(similarity) FROM plagiarism_results pr WHERE pr.submission_id = s.id) as max_similarity
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        JOIN users u ON s.user_id = u.id
        WHERE s.assignment_id = ?
        ORDER BY s.submit_time DESC
      `, [assignmentId]);
    }
    
    res.json({ submissions });
  } catch (error) {
    console.error('Get submissions by assignment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const submission = await get(`
      SELECT s.*, a.title as assignment_title, u.name as student_name, u.username as student_username
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [req.params.id]);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    if (req.user.role === 'student' && submission.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const plagiarismResults = await all(`
      SELECT pr.*, 
             s2.user_id as compared_user_id,
             u2.name as compared_student_name,
             s2.version as compared_version
      FROM plagiarism_results pr
      JOIN submissions s2 ON pr.compared_submission_id = s2.id
      JOIN users u2 ON s2.user_id = u2.id
      WHERE pr.submission_id = ?
      ORDER BY pr.similarity DESC
    `, [req.params.id]);
    
    res.json({ submission, plagiarismResults });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, requireRole('student'), upload.single('file'), async (req, res) => {
  try {
    const { assignmentId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!isSupportedFormat(req.file.originalname)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Unsupported file format' });
    }
    
    const assignment = await get('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
    if (!assignment) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const lastSubmission = await get(`
      SELECT MAX(version) as max_version FROM submissions 
      WHERE assignment_id = ? AND user_id = ?
    `, [assignmentId, req.user.id]);
    
    const version = (lastSubmission?.max_version || 0) + 1;
    
    if (version > 1 && !assignment.allow_resubmit) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Resubmission is not allowed for this assignment' });
    }
    
    let parsedContent;
    try {
      const parsed = parseFile(req.file.path, req.file.originalname);
      parsedContent = parsed.content;
    } catch (error) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Failed to parse file content' });
    }
    
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    const result = await run(`
      INSERT INTO submissions (assignment_id, user_id, version, file_name, file_path, file_size, parsed_content, ip_address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [assignmentId, req.user.id, version, req.file.originalname, req.file.path, req.file.size, parsedContent, ipAddress, 'submitted']);
    
    const submissionId = result.lastID;
    
    const otherSubmissions = await all(`
      SELECT s.* FROM submissions s
      WHERE s.assignment_id = ? AND s.user_id != ? AND s.id != ?
    `, [assignmentId, req.user.id, submissionId]);
    
    for (const otherSub of otherSubmissions) {
      if (!otherSub.parsed_content) continue;
      
      const similarity = calculateSimilarity(parsedContent, otherSub.parsed_content);
      const similarSegments = findSimilarSegments(parsedContent, otherSub.parsed_content);
      const matchedRules = detectMatchedRules(parsedContent, otherSub.parsed_content);
      
      if (similarity > 10) {
        await run(`
          INSERT INTO plagiarism_results (submission_id, compared_submission_id, similarity, similar_segments, matched_rules)
          VALUES (?, ?, ?, ?, ?)
        `, [submissionId, otherSub.id, similarity, JSON.stringify(similarSegments), JSON.stringify(matchedRules)]);
      }
    }
    
    const submission = await get('SELECT * FROM submissions WHERE id = ?', [submissionId]);
    res.status(201).json({ submission });
  } catch (error) {
    console.error('Submit error:', error);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/content', authenticate, async (req, res) => {
  try {
    const submission = await get('SELECT * FROM submissions WHERE id = ?', [req.params.id]);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    if (req.user.role === 'student' && submission.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ content: submission.parsed_content, fileName: submission.file_name });
  } catch (error) {
    console.error('Get submission content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/run-check', authenticate, requireRole('teacher', 'assistant'), async (req, res) => {
  try {
    const submission = await get('SELECT * FROM submissions WHERE id = ?', [req.params.id]);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    await run('DELETE FROM plagiarism_results WHERE submission_id = ?', [req.params.id]);
    
    const otherSubmissions = await all(`
      SELECT s.* FROM submissions s
      WHERE s.assignment_id = ? AND s.user_id != ? AND s.id != ?
    `, [submission.assignment_id, submission.user_id, submission.id]);
    
    const results = [];
    for (const otherSub of otherSubmissions) {
      if (!otherSub.parsed_content || !submission.parsed_content) continue;
      
      const similarity = calculateSimilarity(submission.parsed_content, otherSub.parsed_content);
      const similarSegments = findSimilarSegments(submission.parsed_content, otherSub.parsed_content);
      const matchedRules = detectMatchedRules(submission.parsed_content, otherSub.parsed_content);
      
      if (similarity > 10) {
        const result = await run(`
          INSERT INTO plagiarism_results (submission_id, compared_submission_id, similarity, similar_segments, matched_rules)
          VALUES (?, ?, ?, ?, ?)
        `, [submission.id, otherSub.id, similarity, JSON.stringify(similarSegments), JSON.stringify(matchedRules)]);
        results.push({ id: result.lastID, similarity, compared_submission_id: otherSub.id });
      }
    }
    
    res.json({ message: 'Plagiarism check completed', results });
  } catch (error) {
    console.error('Run plagiarism check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
