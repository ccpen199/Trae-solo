const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '请先登录',
      data: null
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'may-991-jwt-secret-key-2026');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: '登录已过期，请重新登录',
      data: null
    });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'may-991-jwt-secret-key-2026');
      req.user = decoded;
    } catch (error) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  
  next();
}

module.exports = { verifyToken, optionalAuth };
