const db = require('../database');

function auditLog(action, module) {
  return (req, res, next) => {
    const originalSend = res.send;
    let responseData = null;

    res.send = function(data) {
      responseData = typeof data === 'string' ? data : JSON.stringify(data);
      originalSend.call(this, data);
    };

    res.on('finish', () => {
      try {
        const userId = req.user?.id;
        const username = req.user?.username;
        const role = req.user?.role;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const requestData = JSON.stringify(req.body);

        db.prepare(`
          INSERT INTO audit_logs (user_id, username, role, action, module, ip, user_agent, request_data, response_data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, username, role, action, module, ip, userAgent, requestData, responseData);
      } catch (error) {
        console.error('审计日志写入失败:', error);
      }
    });

    next();
  };
}

module.exports = { auditLog };
