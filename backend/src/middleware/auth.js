const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: '用户不存在' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ message: '账户已被禁用' });
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ message: '权限不足' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: '认证失败', error: error.message });
    }
  };
};

module.exports = auth;
