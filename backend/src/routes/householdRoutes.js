const express = require('express');
const { body } = require('express-validator');
const householdController = require('../controllers/householdController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/statistics', checkPermission('read'), householdController.getStatistics);

router.get('/search', checkPermission('read'), householdController.searchHousehold);

router.get('/', checkPermission('read'), householdController.getAllHouseholds);

router.get('/:id', checkPermission('read'), householdController.getHouseholdById);

router.post(
  '/',
  checkPermission('write'),
  [
    body('name').notEmpty().withMessage('姓名不能为空')
      .isLength({ min: 2, max: 50 }).withMessage('姓名长度应在2-50个字符之间'),
    body('idCard').notEmpty().withMessage('身份证号不能为空'),
    body('gender').notEmpty().withMessage('性别不能为空')
      .isIn(['male', 'female']).withMessage('性别选择无效'),
    body('age').notEmpty().withMessage('年龄不能为空')
      .isInt({ min: 0, max: 150 }).withMessage('年龄必须在0-150之间'),
    body('currentAddress').notEmpty().withMessage('现住址不能为空'),
    body('householdAddress').notEmpty().withMessage('户籍地址不能为空')
  ],
  householdController.createHousehold
);

router.put(
  '/:id',
  checkPermission('write'),
  [
    body('name').optional().notEmpty().withMessage('姓名不能为空')
      .isLength({ min: 2, max: 50 }).withMessage('姓名长度应在2-50个字符之间'),
    body('gender').optional().isIn(['male', 'female']).withMessage('性别选择无效'),
    body('age').optional().isInt({ min: 0, max: 150 }).withMessage('年龄必须在0-150之间'),
    body('status').optional().isIn(['active', 'inactive', 'moved', 'deleted']).withMessage('状态无效')
  ],
  householdController.updateHousehold
);

router.post(
  '/:id/move-in',
  checkPermission('write'),
  [
    body('newAddress').notEmpty().withMessage('新地址不能为空')
  ],
  householdController.moveInHousehold
);

router.post(
  '/:id/move-out',
  checkPermission('write'),
  [
    body('destination').notEmpty().withMessage('目的地不能为空')
  ],
  householdController.moveOutHousehold
);

router.post(
  '/:id/cancel',
  checkPermission('delete'),
  householdController.cancelHousehold
);

module.exports = router;
