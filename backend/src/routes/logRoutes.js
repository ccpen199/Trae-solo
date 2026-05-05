const express = require('express');
const { body } = require('express-validator');
const logController = require('../controllers/logController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const { createLogMiddleware } = require('../middlewares/log');

const router = express.Router();

router.use(authenticateToken);

router.get('/modules', logController.getModuleList);

router.use(requireAdmin);

router.get('/', logController.getLogList);

router.get('/statistics', logController.getLogStatistics);

router.get('/:id', logController.getLogDetail);

router.post(
  '/send-emails',
  [
    body('receivers').isArray().withMessage('收件人列表必须是数组'),
    body('receivers').custom((value) => {
      if (value.length === 0) {
        throw new Error('请至少添加一个收件人');
      }
      return true;
    }),
    body('subject').notEmpty().withMessage('邮件主题不能为空')
  ],
  createLogMiddleware('send_email', 'log'),
  logController.sendBatchEmails
);

module.exports = router;