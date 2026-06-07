const express = require('express');
const { createResume, updateResume, getMyResumes, getResumeDetail } = require('../controllers/resumeController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, requireRole(['jobseeker']), createResume);
router.put('/:id', authenticateToken, requireRole(['jobseeker']), updateResume);
router.get('/my', authenticateToken, requireRole(['jobseeker']), getMyResumes);
router.get('/:id', authenticateToken, getResumeDetail);

module.exports = router;
