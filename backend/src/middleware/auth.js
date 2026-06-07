const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '3c-repair-o2o-secret-key-2024');
    req.user = decoded;
    next();
  } catch (error) {
    next();
  }
};

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '3c-repair-o2o-secret-key-2024');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token无效' });
  }
};

module.exports = { authMiddleware, requireAuth };
