const jwt = require('jsonwebtoken');
const { getQuery } = require('../database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getQuery('SELECT id, phone, nickname, avatar FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token无效或已过期' });
  }
};

module.exports = { authenticateToken };
