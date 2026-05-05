const { query } = require('../config/database');

const logOperation = async (req, action, module, targetId = null, targetName = null, status = 'success', message = '') => {
  try {
    const userId = req.user ? req.user.id : null;
    const username = req.user ? req.user.username : 'unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    const requestData = JSON.stringify({
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: req.body
    });

    await query(
      `INSERT INTO operation_logs 
       (user_id, username, action, module, target_id, target_name, 
        ip_address, user_agent, request_data, status, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)`,
      [userId, username, action, module, targetId, targetName, 
       ipAddress, userAgent, requestData, status, message]
    );
  } catch (error) {
    console.error('Failed to log operation:', error);
  }
};

const createLogMiddleware = (action, module, getTargetId = null, getTargetName = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    let responseBody = null;

    res.send = function (body) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.on('finish', async () => {
      try {
        let status = 'success';
        let message = '操作成功';
        let targetId = null;
        let targetName = null;

        if (res.statusCode >= 400) {
          status = 'failed';
          try {
            const parsed = JSON.parse(responseBody);
            message = parsed.message || '操作失败';
          } catch {
            message = `操作失败，状态码: ${res.statusCode}`;
          }
        }

        if (getTargetId) {
          targetId = getTargetId(req, responseBody);
        } else if (req.params.id) {
          targetId = parseInt(req.params.id);
        } else if (req.body.id) {
          targetId = parseInt(req.body.id);
        }

        if (getTargetName) {
          targetName = getTargetName(req, responseBody);
        } else if (req.body.name) {
          targetName = req.body.name;
        } else if (req.body.username) {
          targetName = req.body.username;
        } else if (req.body.supplier_name) {
          targetName = req.body.supplier_name;
        } else if (req.body.product_name) {
          targetName = req.body.product_name;
        } else if (req.body.type_name) {
          targetName = req.body.type_name;
        }

        await logOperation(req, action, module, targetId, targetName, status, message);
      } catch (error) {
        console.error('Log middleware error:', error);
      }
    });

    next();
  };
};

module.exports = {
  logOperation,
  createLogMiddleware
};