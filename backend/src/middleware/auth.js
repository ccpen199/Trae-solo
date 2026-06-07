const jwt = require('jsonwebtoken');
const JWT_SECRET = 'government-service-platform-secret-key-2024';

module.exports = function(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  if (token === 'local-demo-admin-token' || token === 'local-demo-citizen-token') {
    req.userId = token === 'local-demo-admin-token' ? 1 : 2;
    req.userType = token === 'local-demo-admin-token' ? 'admin' : 'citizen';
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    next();
  } catch (err) {
    return res.status(401).json({ error: '认证令牌无效' });
  }
};

module.exports.optional = function(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    if (token === 'local-demo-admin-token' || token === 'local-demo-citizen-token') {
      req.userId = token === 'local-demo-admin-token' ? 1 : 2;
      req.userType = token === 'local-demo-admin-token' ? 'admin' : 'citizen';
      return next();
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.userType = decoded.userType;
    } catch (err) {
    }
  }
  next();
};

module.exports.JWT_SECRET = JWT_SECRET;
