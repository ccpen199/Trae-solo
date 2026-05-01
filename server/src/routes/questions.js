const express = require('express');
const router = express.Router();
const QuestionController = require('../controllers/QuestionController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');

const questionController = new QuestionController();

router.post('/', authenticateToken, (req, res) => questionController.createQuestion(req, res));

router.post('/:questionId/publish', authenticateToken, (req, res) => questionController.publishQuestion(req, res));

router.get('/my', authenticateToken, (req, res) => questionController.getMyQuestions(req, res));

router.get('/:questionId', optionalAuth, (req, res) => questionController.getQuestion(req, res));

router.get('/', optionalAuth, (req, res) => questionController.getQuestions(req, res));

router.put('/:questionId', authenticateToken, (req, res) => questionController.updateQuestion(req, res));

router.delete('/:questionId', authenticateToken, (req, res) => questionController.deleteQuestion(req, res));

router.post('/:questionId/vote', authenticateToken, (req, res) => questionController.voteQuestion(req, res));

router.get('/:questionId/answers', optionalAuth, (req, res) => questionController.getQuestionAnswers(req, res));

router.get('/:questionId/workflow', authenticateToken, (req, res) => questionController.getWorkflowStatus(req, res));

module.exports = router;
