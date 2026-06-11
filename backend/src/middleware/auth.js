const jwt = require('jsonwebtoken');
const db = require('../db');
const { error } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'hr-saas-secret-key-2024';

function generateToken(user, userType = 'hr') {
  const token = jwt.sign(
    {
      id: user.id,
      userType,
      email: user.email,
      companyId: user.company_id
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return token;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader) {
    return res.status(401).json(error('未提供认证令牌', 401));
  }
  
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json(error('认证令牌无效或已过期', 401));
  }
  
  const user = db.prepare(`
    SELECT * FROM hr_users 
    WHERE id = ? AND status = 'active'
  `).get(decoded.id);
  
  if (!user) {
    return res.status(401).json(error('用户不存在或已被禁用', 401));
  }
  
  req.user = user;
  req.userId = user.id;
  req.companyId = user.company_id;
  req.userType = 'hr';
  
  next();
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json(error('需要管理员权限', 403));
  }
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  adminMiddleware,
  JWT_SECRET
};
