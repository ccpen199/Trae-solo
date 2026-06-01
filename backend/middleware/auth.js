const jwt = require('jsonwebtoken');

module.exports = (db) => {
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'meeting-system-jwt-secret-2024', (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      
      const userRecord = db.prepare('SELECT id, username, email, phone, nickname, avatar, member_level FROM users WHERE id = ?').get(user.userId);
      if (!userRecord) {
        return res.status(403).json({ error: 'User not found' });
      }
      
      req.user = userRecord;
      next();
    });
  };

  const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET || 'meeting-system-jwt-secret-2024', (err, user) => {
      if (!err && user) {
        const userRecord = db.prepare('SELECT id, username, email, phone, nickname, avatar, member_level FROM users WHERE id = ?').get(user.userId);
        if (userRecord) {
          req.user = userRecord;
        }
      }
      next();
    });
  };

  return { authenticateToken, optionalAuth };
};
