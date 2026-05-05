const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '访问令牌缺失，请先登录' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await query(
      'SELECT id, username, real_name, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: '用户不存在，请重新登录' 
      });
    }

    const user = result.rows[0];
    
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: '账号已被禁用，请联系管理员' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: '令牌已过期，请重新登录' 
      });
    }
    return res.status(403).json({ 
      success: false, 
      message: '无效的访问令牌' 
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: '需要管理员权限' 
    });
  }
  next();
};

const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足，无法访问该资源' 
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAnyRole
};