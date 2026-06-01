import db from '../database/index.js';

export function authMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: '未登录' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ? AND status = 1').get(userId);
  if (!user) {
    return res.status(401).json({ error: '用户不存在或已被禁用' });
  }

  req.user = user;
  next();
}

export function adminMiddleware(req, res, next) {
  if (req.user.username !== 'admin') {
    return res.status(403).json({ error: '无权限访问' });
  }
  next();
}
