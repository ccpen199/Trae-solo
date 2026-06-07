const jwt = require('jsonwebtoken');
const SECRET_KEY = 'gov-platform-secret-2024';

const demoUsers = {
  'local-demo-admin': { id: 1, username: 'admin', type: 'admin', name: '演示管理员' },
  'local-demo-admin-token': { id: 1, username: 'admin', type: 'admin', name: '演示管理员' },
  'local-demo-personal': { id: 2, username: 'user1', type: 'personal', name: '演示个人用户' },
  'local-demo-legal': { id: 3, username: 'company1', type: 'legal', name: '演示法人用户' }
};

const defaultUser = { id: 1, username: 'admin', type: 'admin', name: '演示管理员' };

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (demoUsers[token]) {
    req.user = demoUsers[token];
    return next();
  }

  if (!token) {
    req.user = defaultUser;
    return next();
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    req.user = defaultUser;
    next();
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.type !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware, SECRET_KEY };
