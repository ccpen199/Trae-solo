const jwt = require('jsonwebtoken');
const db = require('../models/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }

    const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    
    if (!dbUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (dbUser.status !== 'active') {
      return res.status(403).json({ error: '用户已被禁用' });
    }

    req.user = dbUser;
    next();
  });
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

const logOperation = (module) => {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function(body) {
      try {
        const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
        const success = responseBody.error ? false : true;
        
        db.prepare(`
          INSERT INTO operation_logs (id, user_id, session_id, action, module, detail, ip_address, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          require('uuid').v4(),
          req.user ? req.user.id : null,
          req.params.sessionId || req.body.sessionId,
          req.method,
          module,
          JSON.stringify({ path: req.path, body: req.body, success }),
          req.ip || req.connection.remoteAddress
        );
      } catch (err) {
        console.error('操作日志记录失败:', err);
      }
      
      return originalSend.call(this, body);
    };
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  logOperation
};
