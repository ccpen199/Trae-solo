const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = 'book-club-secret-key-2024';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const dbUser = db.prepare('SELECT id, username, name, role, email FROM users WHERE id = ?').get(user.id);
    
    if (!dbUser) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = dbUser;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole, JWT_SECRET };
