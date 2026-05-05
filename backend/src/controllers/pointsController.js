const { success, pagination } = require('../utils/response');
const pointsService = require('../services/pointsService');

// 获取积分余额
const getBalance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const balance = await pointsService.getBalance(userId);
    
    res.json(success({ balance }));
  } catch (err) {
    next(err);
  }
};

// 获取积分交易记录
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    
    const result = await pointsService.getTransactions(
      userId,
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

// 模拟获取积分（测试用）
const mockEarnPoints = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount = 100 } = req.body;
    
    const result = await pointsService.addPoints(
      userId,
      parseInt(amount),
      '测试获取积分',
      null,
      'TEST'
    );
    
    res.json(success(result, `成功获得 ${amount} 积分`));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBalance,
  getTransactions,
  mockEarnPoints,
};
