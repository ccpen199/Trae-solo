const express = require('express');
const { body } = require('express-validator');
const topicController = require('../controllers/topicController');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

router.get('/search', topicController.searchTopics);
router.get('/:id', topicController.getTopicById);

router.post('/', [
  authMiddleware,
  body('title').notEmpty().withMessage('标题不能为空'),
  body('content').notEmpty().withMessage('内容不能为空'),
  body('boardId').notEmpty().withMessage('版块ID不能为空')
], topicController.createTopic);

module.exports = router;
