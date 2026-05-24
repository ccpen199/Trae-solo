const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: '认证令牌无效或已过期' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `需要以下角色之一: ${roles.join(', ')}` });
    }
    next();
  };
};

const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '未登录' });
  }
  const ownerId = parseInt(req.params.ownerId || req.body.owner_id || req.query.owner_id);
  if (req.user.role === 'admin' || req.user.role === 'customer_service' || req.user.id === ownerId) {
    return next();
  }
  return res.status(403).json({ error: '无权限访问此资源' });
};

const requireStoreOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '未登录' });
  }
  const storeId = parseInt(req.params.storeId || req.body.store_id || req.query.store_id);
  if (req.user.role === 'admin' || req.user.role === 'customer_service') {
    return next();
  }
  if (req.user.role === 'store' && req.user.id === storeId) {
    return next();
  }
  if (req.user.role === 'staff' && req.user.store_id === storeId) {
    return next();
  }
  return res.status(403).json({ error: '无权限访问此门店资源' });
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnerOrAdmin,
  requireStoreOrAdmin
};
