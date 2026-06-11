const db = require('../config/database');

const auditLog = (module, action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function(body) {
      try {
        const userId = req.user?.id || null;
        const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || '';
        const status = res.statusCode;
        let requestData = '';
        if (req.body) {
          const filtered = { ...req.body };
          ['password', 'id_card', 'phone', 'verify_code'].forEach(k => {
            if (filtered[k]) filtered[k] = '***';
          });
          requestData = JSON.stringify(filtered);
        }
        let responseData = '';
        try {
          if (typeof body === 'string') {
            responseData = body.length > 500 ? body.substring(0, 500) + '...' : body;
          } else if (body) {
            const strBody = JSON.stringify(body);
            responseData = strBody.length > 500 ? strBody.substring(0, 500) + '...' : strBody;
          }
        } catch (e) {}
        db.runAsync('INSERT INTO audit_logs (user_id, action, module, ip, user_agent, request_data, response_data, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          userId, action, module, ip, userAgent, requestData, responseData, status).catch(err => {
          console.error('审计日志写入失败:', err);
        });
      } catch (err) {
        console.error('审计日志写入失败:', err);
      }
      return originalSend.call(this, body);
    };
    next();
  };
};

module.exports = { auditLog };
