const { error } = require('../utils/response');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'shanxi-hrs-secret-key-2025';

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (!token) {
    return res.json(error('未登录，请先登录', 401));
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (e) {
    return res.json(error('登录已过期，请重新登录', 401));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.json(error('未登录', 401));
    }
    if (!roles.includes(req.user.userType)) {
      return res.json(error('权限不足', 403));
    }
    next();
  };
}

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      idCard: user.id_card,
      name: user.name,
      userType: user.user_type,
      socialCardNo: user.social_card_no
    },
    SECRET_KEY,
    { expiresIn: '7d' }
  );
}

module.exports = {
  auth,
  requireRole,
  generateToken,
  SECRET_KEY
};
