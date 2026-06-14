const { db } = require('../models/db');

module.exports = function apiLogger(req, res, next) {
  const startTime = Date.now();
  const userId = req.user?.id || null;
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    try {
      const stmt = db.prepare(`
        INSERT INTO api_logs (user_id, endpoint, method, params, status_code, response_time)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        userId,
        req.path,
        req.method,
        JSON.stringify(req.method === 'GET' ? req.query : req.body),
        res.statusCode,
        responseTime
      );
    } catch (err) {
      console.error('API log error:', err.message);
    }
  });
  
  next();
};
