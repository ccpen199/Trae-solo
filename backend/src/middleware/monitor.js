const monitor = require('../monitoring');

module.exports = function(req, res, next) {
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(body) {
    const duration = Date.now() - startTime;
    monitor.recordRequest(
      req.method,
      req.path,
      res.statusCode,
      duration,
      req.userId || null,
      req.ip
    );
    return originalSend.call(this, body);
  };
  
  next();
};
