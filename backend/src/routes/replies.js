const express = require('express');
const { body } = require('express-validator');
const replyController = require('../controllers/replyController');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

router.get('/topic/:topicId', replyController.getRepliesByTopic);

router.post('/', [
  authMiddleware,
  body('content').notEmpty().withMessage('回复内容不能为空'),
  body('topicId').notEmpty().withMessage('主题ID不能为空')
], replyController.createReply);

module.exports = router;
