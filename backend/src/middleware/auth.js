import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.json({ code: 1, message: '未提供认证令牌' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.rider = decoded;
    next();
  } catch (err) {
    return res.json({ code: 1, message: '令牌无效或已过期' });
  }
}

export function adminOnly(req, res, next) {
  if (!req.rider || req.rider.role !== 'admin') {
    return res.json({ code: 1, message: '需要管理员权限' });
  }
  next();
}
