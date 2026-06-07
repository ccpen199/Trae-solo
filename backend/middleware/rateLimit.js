
const { db } = require('../database');
const { getClientIp } = require('./auth');

function checkRateLimit(action, maxAttempts = 5, windowMinutes = 5) {
  return (req, res, next) => {
    const ip = getClientIp(req);
    
    const existing = db.prepare(`
      SELECT * FROM ip_rate_limits 
      WHERE ip_address = ? AND action = ?
    `).get(ip, action);

    const now = new Date();
    const windowAgo = new Date(now.getTime() - windowMinutes * 60 * 1000);

    if (existing) {
      const lastAttempt = new Date(existing.last_attempt);
      
      if (existing.blocked) {
        db.prepare(`
          UPDATE ip_rate_limits 
          SET last_attempt = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(existing.id);
        
        return res.status(429).json({ 
          error: '操作过于频繁，请稍后再试',
          retryAfter: windowMinutes * 60
        });
      }

      if (lastAttempt > windowAgo) {
        if (existing.count >= maxAttempts) {
          db.prepare(`
            UPDATE ip_rate_limits 
            SET blocked = 1, last_attempt = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).run(existing.id);
          
          return res.status(429).json({ 
            error: '操作过于频繁，请稍后再试',
            retryAfter: windowMinutes * 60
          });
        }
        
        db.prepare(`
          UPDATE ip_rate_limits 
          SET count = count + 1, last_attempt = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(existing.id);
      } else {
        db.prepare(`
          UPDATE ip_rate_limits 
          SET count = 1, blocked = 0, last_attempt = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(existing.id);
      }
    } else {
      db.prepare(`
        INSERT INTO ip_rate_limits (ip_address, action, count, last_attempt)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      `).run(ip, action);
    }

    next();
  };
}

function logAudit(action, details = null) {
  return (req, res, next) => {
    const ip = getClientIp(req);
    const userId = req.user ? req.user.id : null;
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES (?, ?, ?, ?)
    `).run(userId, action, details ? JSON.stringify(details) : null, ip);
    
    next();
  };
}

module.exports = { checkRateLimit, logAudit };
