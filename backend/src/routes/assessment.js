const express = require('express');
const {
  getAssessments,
  getAssessmentDetail,
  submitAssessment,
  getMyAssessments,
  getWrongQuestions
} = require('../controllers/assessment');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAssessments);
router.get('/my', authenticateToken, getMyAssessments);
router.get('/wrong-questions', authenticateToken, getWrongQuestions);
router.get('/:id', getAssessmentDetail);
router.post('/submit', authenticateToken, submitAssessment);

module.exports = router;
