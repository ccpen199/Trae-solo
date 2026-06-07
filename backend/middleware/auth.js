const { getDb } = require('../db/init');

function getDemoUser(db) {
  return db.prepare(`
    SELECT id, username, real_name, phone, id_card, role, auth_source, org_name, level, created_at
    FROM users
    ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'staff' THEN 1 ELSE 2 END, created_at
    LIMIT 1
  `).get();
}

function authMiddleware(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    const db = getDb();
    let user = null;
    if (userId) {
      user = db.prepare('SELECT id, username, real_name, phone, id_card, role, auth_source, org_name, level, created_at FROM users WHERE id = ?').get(userId);
    }
    if (!user) {
      user = getDemoUser(db);
    }
    if (!user) {
      return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: '认证失败' });
  }
}

function optionalAuth(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (userId) {
      const db = getDb();
      const user = db.prepare('SELECT id, username, real_name, phone, id_card, role, auth_source, org_name, level, created_at FROM users WHERE id = ?').get(userId);
      if (user) {
        req.user = user;
      }
    }
  } catch {}
  next();
}

module.exports = { authMiddleware, optionalAuth };
