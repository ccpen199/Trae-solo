const rateLimitStore = new Map();

function rateLimiter(windowMs = 60000, maxRequests = 10) {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitStore.has(clientId)) {
      rateLimitStore.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    const clientData = rateLimitStore.get(clientId);
    
    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试'
      });
    }
    
    clientData.count++;
    next();
  };
}

function clearExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(clearExpiredEntries, 60000);

module.exports = rateLimiter;
