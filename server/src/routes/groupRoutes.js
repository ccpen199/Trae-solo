const express = require('express');
const { body } = require('express-validator');
const groupController = require('../controllers/groupController');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, groupController.getGroups);

router.get('/:id', optionalAuth, groupController.getGroupById);

router.post(
  '/',
  authenticate,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('小组名称长度需在2-100个字符之间'),
  ],
  groupController.createGroup
);

router.post('/:id/join', authenticate, groupController.joinGroup);

router.get('/:id/posts', optionalAuth, groupController.getGroupPosts);

router.post(
  '/:id/posts',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('请输入帖子标题'),
    body('content').trim().notEmpty().withMessage('请输入帖子内容'),
  ],
  groupController.createGroupPost
);

module.exports = router;
