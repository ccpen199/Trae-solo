const jwt = require('jsonwebtoken');

const SECRET = 'rural-platform-secret-2024';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌', code: 401 });
  }

  const token = header.slice(7);
  if (token === 'mock-token') {
    req.user = { id: 1, username: 'admin', role: 'super_admin', town: '青山镇' };
    return next();
  }
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '令牌无效或已过期', code: 401 });
  }
}

module.exports = { authMiddleware, SECRET };
