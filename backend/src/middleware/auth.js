const jwt = require('jsonwebtoken');
const { getOne } = require('../database');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zouxin-wenda-secret-key-2024');
    const user = await getOne('SELECT id, phone, nickname, gender, province, age, alipay_account, balance, score, total_answers, daily_answers, last_answer_date FROM users WHERE id = ?', [decoded.userId]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '登录已过期，请重新登录'
    });
  }
};

module.exports = authMiddleware;
