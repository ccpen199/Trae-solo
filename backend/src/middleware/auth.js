const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'XM_11119_SECRET_KEY_2024';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '未提供认证令牌' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: '令牌无效或已过期' 
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: '用户账户已被禁用或冻结' 
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      trustScore: user.trust_score,
      trustLevel: user.trust_level
    };

    next();
  });
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: '请先登录' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }

    next();
  };
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err) {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
        if (user && user.status === 'active') {
          req.user = {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            role: user.role,
            trustScore: user.trust_score,
            trustLevel: user.trust_level
          };
        }
      }
      next();
    });
  } else {
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  JWT_SECRET
};
