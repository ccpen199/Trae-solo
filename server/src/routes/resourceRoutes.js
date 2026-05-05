const express = require('express');
const { body } = require('express-validator');
const resourceController = require('../controllers/resourceController');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, resourceController.getResources);

router.get('/:id', optionalAuth, resourceController.getResourceById);

router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('请输入资源标题'),
    body('categoryId').notEmpty().withMessage('请选择分类'),
  ],
  resourceController.createResource
);

router.post('/:id/favorite', authenticate, resourceController.toggleFavorite);

router.post(
  '/:id/comments',
  authenticate,
  [
    body('content').trim().notEmpty().withMessage('请输入评论内容'),
  ],
  resourceController.addComment
);

module.exports = router;
