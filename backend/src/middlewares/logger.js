const { OperationLog } = require('../models');

const logOperation = (action, targetType = null, getDetails = null) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = async (data) => {
      if (req.user && data.success !== false) {
        try {
          const targetId = req.params.id || req.body.id || 
                           (targetType && req.params[targetType.toLowerCase() + 'Id']);
          
          const details = getDetails ? getDetails(req, data) : JSON.stringify({
            body: req.body,
            params: req.params
          });
          
          await OperationLog.create({
            userId: req.user.id,
            username: req.user.username,
            action: action,
            targetType: targetType,
            targetId: targetId,
            details: details,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          });
        } catch (err) {
          console.error('记录操作日志失败:', err.message);
        }
      }
      return originalJson(data);
    };
    
    next();
  };
};

module.exports = {
  logOperation
};
