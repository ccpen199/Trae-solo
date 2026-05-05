const express = require('express');
const lotteryController = require('../controllers/lotteryController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 大转盘抽奖
router.post('/wheel', authMiddleware, lotteryController.spinWheel);

// 砸蛋抽奖
router.post('/egg', authMiddleware, lotteryController.hitEgg);

// 获取我的奖品列表
router.get('/prizes', authMiddleware, lotteryController.getUserPrizes);

// 领取奖品
router.post('/prizes/:id/receive', authMiddleware, lotteryController.receivePrize);

// 立即兑换积分奖品（砸蛋专用）
router.post('/prizes/:id/redeem', authMiddleware, lotteryController.redeemPointsPrize);

module.exports = router;
