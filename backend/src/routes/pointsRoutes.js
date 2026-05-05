const express = require('express');
const pointsController = require('../controllers/pointsController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取积分余额
router.get('/balance', authMiddleware, pointsController.getBalance);

// 获取积分交易记录
router.get('/transactions', authMiddleware, pointsController.getTransactions);

// 模拟获取积分（测试用）
router.post('/mock-earn', authMiddleware, pointsController.mockEarnPoints);

module.exports = router;
