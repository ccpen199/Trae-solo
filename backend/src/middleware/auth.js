const jwt = require('jsonwebtoken');
const { db } = require('../models/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    const userRecord = db.prepare('SELECT id, phone, email, name, personal_meeting_id FROM users WHERE id = ?').get(user.userId);
    if (!userRecord) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    req.user = userRecord;
    next();
  });
};

module.exports = { authenticateToken };
