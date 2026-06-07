const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const generateWatermark = (userId, action, timestamp) => {
  const data = `${userId}-${action}-${timestamp}-${process.env.JWT_SECRET}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

const auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    let responseSent = false;

    res.send = function(data) {
      if (!responseSent) {
        responseSent = true;
        
        const timestamp = Date.now();
        const watermark = generateWatermark(req.user?.id || 'anonymous', action, timestamp);

        prisma.auditLog.create({
          data: {
            userId: req.user?.id || 'system',
            action,
            resource,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            watermark,
            secondVerified: req.secondVerified || false,
          },
        }).catch(err => console.error('Audit log error:', err));
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  auditLog,
  generateWatermark,
};
