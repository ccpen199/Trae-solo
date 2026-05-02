const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../config/database');

const IDEMPOTENT_HEADER = 'X-Idempotency-Key';
const IDEMPOTENT_EXPIRES_HOURS = 24;

const checkIdempotency = async (req, res, next) => {
  const idempotencyKey = req.headers[IDEMPOTENT_HEADER.toLowerCase()] || req.body._idempotencyKey;
  
  if (!idempotencyKey) {
    req.idempotencyKey = uuidv4();
    return next();
  }
  
  const existing = query(
    `SELECT * FROM idempotent_requests 
     WHERE idempotency_key = ? 
     AND (expires_at IS NULL OR expires_at > datetime('now'))`,
    [idempotencyKey]
  );
  
  if (existing.length > 0) {
    const record = existing[0];
    res.status(record.response_status || 200);
    return res.json(JSON.parse(record.response_body || '{}'));
  }
  
  req.idempotencyKey = idempotencyKey;
  
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    try {
      const expiresAt = new Date(Date.now() + IDEMPOTENT_EXPIRES_HOURS * 60 * 60 * 1000);
      
      run(
        `INSERT INTO idempotent_requests 
         (idempotency_key, user_id, request_path, request_method, request_body, 
          response_status, response_body, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
        [
          idempotencyKey,
          req.user ? req.user.id : null,
          req.path,
          req.method,
          JSON.stringify(req.body),
          res.statusCode,
          JSON.stringify(body),
          expiresAt.toISOString()
        ]
      );
    } catch (error) {
      console.error('幂等记录保存失败:', error);
    }
    return originalJson(body);
  };
  
  next();
};

const clearExpired = () => {
  run(
    `DELETE FROM idempotent_requests WHERE expires_at < datetime('now')`
  );
};

module.exports = {
  checkIdempotency,
  clearExpired,
  IDEMPOTENT_HEADER
};
