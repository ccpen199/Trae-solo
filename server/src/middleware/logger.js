const pool = require('../config/database');
const logger = require('../config/logger');

const logOperation = async (req, res, action, module, description, status = 1) => {
  try {
    const userId = req.user?.id || null;
    const username = req.user?.username || 'anonymous';
    const ipAddress = req.ip || req.connection?.remoteAddress || 
                      req.headers['x-forwarded-for']?.split(',')[0] || '';
    const userAgent = req.headers['user-agent'] || '';
    const requestMethod = req.method;
    const requestUrl = req.originalUrl || req.url;

    await pool.query(
      `INSERT INTO operation_logs 
       (user_id, username, action, module, description, ip_address, user_agent, 
        request_method, request_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userId, username, action, module, description, ipAddress, userAgent, 
       requestMethod, requestUrl, status]
    );

    logger.info(`操作日志: ${action} - ${module} - ${description}`);
  } catch (error) {
    logger.error('记录操作日志失败:', error);
  }
};

const operationLogger = (action, module) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      let status = 1;
      let description = '操作成功';
      
      try {
        const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
        if (parsedBody.success === false) {
          status = 0;
          description = parsedBody.message || '操作失败';
        }
      } catch (e) {
        // 忽略解析错误
      }

      logOperation(req, res, action, module, description, status);
      
      return originalSend.call(this, body);
    };
    
    next();
  };
};

module.exports = {
  logOperation,
  operationLogger
};
