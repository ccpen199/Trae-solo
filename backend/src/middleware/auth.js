import jwt from 'jsonwebtoken';
import { error } from '../utils/response.js';

const JWT_SECRET = process.env.JWT_SECRET || 'parttime_saas_jwt_secret_2026';

export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json(error('未登录', 401));
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json(error('Token无效或已过期', 401));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json(error('未登录', 401));
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(error('无权限访问', 403));
    }
    next();
  };
}
