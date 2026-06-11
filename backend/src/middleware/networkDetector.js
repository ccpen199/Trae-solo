const { db } = require('../db');

function detectNetworkStatus(req, res, next) {
  const networkHeader = req.headers['x-network-status'];
  const responseTime = Number(req.headers['x-response-time']) || 0;
  const packetLoss = Number(req.headers['x-packet-loss']) || 0;
  
  let networkStatus = 'good';
  
  if (networkHeader) {
    networkStatus = networkHeader;
  } else if (responseTime > 500 || packetLoss > 0.1) {
    networkStatus = 'weak';
  } else if (responseTime > 200 || packetLoss > 0.05) {
    networkStatus = 'moderate';
  }
  
  req.networkStatus = networkStatus;
  res.setHeader('X-Network-Status', networkStatus);
  next();
}

function getCachedData(cacheKey) {
  const now = new Date().toISOString();
  const cache = db.prepare(
    'SELECT cache_data FROM offline_cache WHERE cache_key = ? AND expires_at > ?'
  ).get(cacheKey, now);
  
  return cache ? JSON.parse(cache.cache_data) : null;
}

function setCachedData(cacheKey, data, ttlHours = 24) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);
  
  db.prepare(`
    INSERT INTO offline_cache (cache_key, cache_data, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET
      cache_data = excluded.cache_data,
      expires_at = excluded.expires_at,
      created_at = CURRENT_TIMESTAMP
  `).run(cacheKey, JSON.stringify(data), expiresAt.toISOString());
}

module.exports = { detectNetworkStatus, getCachedData, setCachedData };
