const { success, error, pagination } = require('../utils/response');
const lotteryService = require('../services/lotteryService');

// 大转盘抽奖
const spinWheel = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await lotteryService.executeLottery(userId, 'WHEEL');
    
    if (result.isWinner) {
      res.json(success(result, `恭喜您获得 ${result.prize.name}！`));
    } else {
      res.json(success(result, '很遗憾，您没有中奖'));
    }
  } catch (err) {
    // 积分不足的特殊处理
    if (err.message === 'INSUFFICIENT_POINTS') {
      return res.status(400).json(error('积分不足，请先获取积分', 'INSUFFICIENT_POINTS'));
    }
    next(err);
  }
};

// 砸蛋抽奖
const hitEgg = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await lotteryService.executeLottery(userId, 'EGG');
    
    if (result.isWinner) {
      res.json(success(result, `恭喜您获得 ${result.prize.name}！`));
    } else {
      res.json(success(result, '很遗憾，您没有中奖'));
    }
  } catch (err) {
    // 积分不足的特殊处理
    if (err.message === 'INSUFFICIENT_POINTS') {
      return res.status(400).json(error('积分不足，请先获取积分', 'INSUFFICIENT_POINTS'));
    }
    next(err);
  }
};

// 获取我的奖品列表
const getUserPrizes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, pageSize = 20 } = req.query;
    
    const result = await lotteryService.getUserPrizes(
      userId,
      status,
      parseInt(page),
      parseInt(pageSize)
    );
    
    res.json(success(pagination(
      result.list,
      result.total,
      result.page,
      result.pageSize
    )));
  } catch (err) {
    next(err);
  }
};

// 领取奖品
const receivePrize = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await lotteryService.receivePrize(userId, id);
    
    res.json(success(result, '领奖成功'));
  } catch (err) {
    next(err);
  }
};

// 立即兑换积分奖品（砸蛋专用）
const redeemPointsPrize = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await lotteryService.redeemPointsPrize(userId, id);
    
    res.json(success(result, `兑换成功，获得 ${result.pointsValue} 积分`));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  spinWheel,
  hitEgg,
  getUserPrizes,
  receivePrize,
  redeemPointsPrize,
};
