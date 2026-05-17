const express = require('express');
const { body } = require('express-validator');
const {
  createTopic,
  getTopics,
  getTopicById,
  addComment,
  getComments,
  searchTopics
} = require('../controllers/topicController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, [
  body('planet_id').notEmpty().withMessage('星球ID不能为空'),
  body('title').notEmpty().withMessage('标题不能为空'),
  body('content').notEmpty().withMessage('内容不能为空')
], createTopic);

router.get('/', getTopics);
router.get('/search', searchTopics);
router.get('/:id', getTopicById);

router.post('/comments', authenticate, [
  body('topic_id').notEmpty().withMessage('主题ID不能为空'),
  body('content').notEmpty().withMessage('评论内容不能为空')
], addComment);

router.get('/comments/list', getComments);

module.exports = router;
