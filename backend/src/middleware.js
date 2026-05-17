const jwt = require('jsonwebtoken');
const { getQuery } = require('./database');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getQuery('SELECT id, phone, nickname, avatar, bio FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }
};

const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: '服务器错误' });
};

const validateParams = (requiredParams) => {
  return (req, res, next) => {
    const missing = requiredParams.filter(param => !req.body[param] && !req.query[param] && !req.params[param]);
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: `缺少参数: ${missing.join(', ')}` });
    }
    next();
  };
};

module.exports = { authMiddleware, errorHandler, validateParams };
