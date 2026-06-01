const db = require('../database');

const logOperation = (module, operation) => (req, res, next) => {
  const originalSend = res.send;
  let responseBody = '';
  
  res.send = function(body) {
    responseBody = typeof body === 'string' ? body : JSON.stringify(body);
    return originalSend.apply(this, arguments);
  };

  res.on('finish', () => {
    const logStmt = db.prepare(`
      INSERT INTO operation_logs (user_id, module, operation, target_type, target_id, ip_address, user_agent, request_params, response_result, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    logStmt.run(
      req.user?.id || null,
      module,
      operation,
      req.params.type || null,
      req.params.id ? parseInt(req.params.id) : null,
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent'],
      JSON.stringify({ body: req.body, query: req.query }),
      responseBody.substring(0, 1000),
      res.statusCode < 400 ? 1 : 0
    );
  });

  next();
};

module.exports = { logOperation };
