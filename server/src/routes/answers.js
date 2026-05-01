const express = require('express');
const router = express.Router();
const AnswerController = require('../controllers/AnswerController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const answerController = new AnswerController();

router.post('/:questionId', authenticateToken, (req, res) => answerController.createAnswer(req, res));

router.get('/my', authenticateToken, (req, res) => answerController.getMyAnswers(req, res));

router.get('/:answerId', optionalAuth, (req, res) => answerController.getAnswer(req, res));

router.put('/:answerId', authenticateToken, (req, res) => answerController.updateAnswer(req, res));

router.delete('/:answerId', authenticateToken, (req, res) => answerController.deleteAnswer(req, res));

router.post('/:answerId/vote', authenticateToken, (req, res) => answerController.voteAnswer(req, res));

router.post('/:answerId/accept/:questionId', authenticateToken, (req, res) => answerController.acceptAnswer(req, res));

router.get('/:answerId/stats', authenticateToken, (req, res) => answerController.getAnswerStats(req, res));

module.exports = router;
