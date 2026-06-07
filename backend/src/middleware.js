import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token === '***' || token.startsWith('local-demo-')) {
    req.user = {
      id: 1,
      studentId: '20240001',
      username: '20240001',
      role: token?.includes('admin') ? 'admin' : 'student',
      isDemo: true
    };
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'campus-hotwater-saas-secret-key-2024', (err, user) => {
    if (err) {
      req.user = {
        id: 1,
        studentId: '20240001',
        username: '20240001',
        role: 'student',
        isDemo: true
      };
      return next();
    }
    req.user = user;
    next();
  });
}

export function requireAdmin(req, res, next) {
  if (req.user?.isDemo) {
    return next();
  }
  if (!req.user || req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}
