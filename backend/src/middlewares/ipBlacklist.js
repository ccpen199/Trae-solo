const prisma = require('../utils/prisma');
const { safeRedis } = require('../utils/redis');
const logger = require('../utils/logger');

const BLACKLIST_CACHE_PREFIX = 'ip_blacklist:';
const CACHE_TTL = 300;

async function checkIPBlacklist(req, res, next) {
  const clientIP = getClientIP(req);
  
  try {
    const cacheKey = BLACKLIST_CACHE_PREFIX + clientIP;
    
    const cached = await safeRedis.get(cacheKey);
    if (cached !== null) {
      if (cached.blocked) {
        logger.warn(`Blocked IP [${clientIP}] attempted access (from cache)`);
        return res.status(403).json({
          code: 403,
          message: '您的IP已被禁止访问',
          data: null
        });
      }
      return next();
    }
    
    const blacklistEntry = await prisma.iPBlacklist.findFirst({
      where: {
        ip: clientIP,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    
    if (blacklistEntry) {
      logger.warn(`Blocked IP [${clientIP}] attempted access: ${blacklistEntry.reason || 'No reason'}`);
      await safeRedis.set(cacheKey, { blocked: true, reason: blacklistEntry.reason }, CACHE_TTL);
      return res.status(403).json({
        code: 403,
        message: '您的IP已被禁止访问',
        data: null
      });
    }
    
    await safeRedis.set(cacheKey, { blocked: false }, CACHE_TTL);
    next();
  } catch (err) {
    logger.error('IP黑名单检查失败:', err.message);
    next();
  }
}

function getClientIP(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  const remoteAddress = req.socket?.remoteAddress || req.connection?.remoteAddress;
  if (remoteAddress) {
    if (remoteAddress === '::1' || remoteAddress === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }
    return remoteAddress.replace('::ffff:', '');
  }
  
  return 'unknown';
}

module.exports = {
  checkIPBlacklist,
  getClientIP
};
