const jwt = require('jsonwebtoken');
const { db } = require('../models/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token无效' });
    }
    
    const user = db.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
