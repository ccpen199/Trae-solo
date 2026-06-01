const jwt = require('jsonwebtoken');
const db = require('../database');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    const userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    if (!userRecord || userRecord.status === 'frozen') {
      return res.status(403).json({ error: 'Account is frozen or not exists' });
    }
    
    req.user = userRecord;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

function logBehavior(action, targetType = null, targetId = null) {
  return (req, res, next) => {
    const fingerprint = req.headers['x-device-fingerprint'] || null;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    db.prepare(`
      INSERT INTO behavior_logs (user_id, action, target_type, target_id, ip, user_agent, device_fingerprint)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user ? req.user.id : null,
      action,
      targetType,
      targetId,
      ip,
      userAgent,
      fingerprint
    );
    next();
  };
}

module.exports = { authenticateToken, requireRole, logBehavior };
