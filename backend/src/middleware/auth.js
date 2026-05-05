const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'bike_sharing_jwt_secret_key_2024';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, phone, nickname, is_verified, has_deposit, credit_authorized, credit_score, status FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: '账户已被禁用' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: '登录已过期，请重新登录' });
  }
};

const checkVerification = (req, res, next) => {
  if (!req.user.is_verified) {
    return res.status(403).json({ 
      error: '请先完成实名认证',
      code: 'VERIFICATION_REQUIRED'
    });
  }
  next();
};

const checkDeposit = (req, res, next) => {
  const user = req.user;
  const hasValidDeposit = user.has_deposit === 1 || (user.credit_authorized === 1 && user.credit_score >= 650);
  
  if (!hasValidDeposit) {
    return res.status(403).json({ 
      error: '请先缴纳押金或授权芝麻信用免押',
      code: 'DEPOSIT_REQUIRED',
      userDeposit: user.has_deposit,
      creditAuthorized: user.credit_authorized,
      creditScore: user.credit_score
    });
  }
  next();
};

const checkActiveRide = (req, res, next) => {
  const activeOrder = db.prepare(`
    SELECT id, order_no, bike_id, start_time, status 
    FROM orders 
    WHERE user_id = ? AND status = 'riding'
  `).get(req.user.id);

  if (activeOrder) {
    return res.status(400).json({ 
      error: '您有正在进行的订单，请先还车',
      code: 'ACTIVE_RIDE_EXISTS',
      order: activeOrder
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  checkVerification,
  checkDeposit,
  checkActiveRide
};
