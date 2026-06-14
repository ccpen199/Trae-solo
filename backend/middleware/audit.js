const db = require('../database');

function auditLog(operation, module, targetType) {
  return (req, res, next) => {
    const originalSend = res.send;
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    res.send = function(data) {
      let status = 1;
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsed && parsed.code && parsed.code >= 400) status = 0;
      } catch (e) {}

      const userId = req.user ? req.user.id : null;
      const username = req.user ? req.user.username : (req.body ? req.body.username : null);
      const detail = JSON.stringify({
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        params: req.params
      });

      let targetId = null;
      if (req.params && req.params.id) targetId = parseInt(req.params.id);
      if (req.body && req.body.id && !targetId) targetId = parseInt(req.body.id);

      db.run('INSERT INTO audit_logs (user_id, username, operation, module, target_type, target_id, detail, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, username, operation, module, targetType, targetId, detail, ip, userAgent, status]);

      originalSend.call(this, data);
    };

    next();
  };
}

function operationLog(operation) {
  return (req, res, next) => {
    const originalSend = res.send;
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';

    res.send = function(data) {
      const userId = req.user ? req.user.id : null;
      const operatorName = req.user ? req.user.real_name : null;

      let applicationId = null;
      if (req.params && req.params.applicationId) applicationId = parseInt(req.params.applicationId);
      if (req.params && req.params.id) applicationId = parseInt(req.params.id);
      if (req.body && req.body.application_id) applicationId = parseInt(req.body.application_id);

      const detail = JSON.stringify({
        method: req.method,
        path: req.path,
        body: req.body,
        response: typeof data === 'string' ? data.substring(0, 500) : null
      });

      db.run('INSERT INTO operation_logs (application_id, operator_id, operator_name, operation, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [applicationId, userId, operatorName, operation, detail, ip]);

      originalSend.call(this, data);
    };

    next();
  };
}

module.exports = { auditLog, operationLog };
