const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', adminController.getDashboardStats);

router.get('/users/pending', adminController.getPendingUsers);

router.post(
  '/users/:id/review',
  [
    body('action').isIn(['approve', 'reject']).withMessage('无效的操作'),
  ],
  adminController.reviewUser
);

router.get('/resources/pending', adminController.getPendingResources);

router.post(
  '/resources/:id/review',
  [
    body('action').isIn(['approve', 'reject']).withMessage('无效的操作'),
  ],
  adminController.reviewResource
);

router.get('/comments/pending', adminController.getPendingComments);

router.post(
  '/comments/:id/review',
  [
    body('action').isIn(['approve', 'reject']).withMessage('无效的操作'),
  ],
  adminController.reviewComment
);

router.get('/categories', adminController.getCategories);

router.post(
  '/categories',
  [
    body('name').trim().notEmpty().withMessage('请输入分类名称'),
    body('slug').trim().notEmpty().withMessage('请输入分类标识'),
  ],
  adminController.createCategory
);

router.put(
  '/categories/:id',
  adminController.updateCategory
);

module.exports = router;
