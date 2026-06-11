const { db } = require('../db');

function auth(req, res, next) {
  const userId = req.headers['x-user-id'] || process.env.DEMO_USER_ID || '1';

  const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid user' });
  }

  req.user = user;
  next();
}

module.exports = { auth };
