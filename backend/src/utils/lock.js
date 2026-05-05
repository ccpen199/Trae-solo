const { getRedis, checkRedisAvailable } = require('../config/redis');

// 内存锁 - Redis 不可用时的降级方案
const memoryLocks = new Map();
const memoryLockTTL = 10000;

// 获取分布式锁
const acquireLock = async (key, ttl = 10000) => {
  const redis = getRedis();
  
  if (checkRedisAvailable()) {
    // 使用 Redis 分布式锁
    const result = await redis.set(key, '1', 'PX', ttl, 'NX');
    return result === 'OK';
  } else {
    // Redis 不可用，降级为内存锁
    const now = Date.now();
    const lockData = memoryLocks.get(key);
    
    if (!lockData || now > lockData.expireAt) {
      memoryLocks.set(key, { expireAt: now + ttl });
      return true;
    }
    return false;
  }
};

// 释放锁
const releaseLock = async (key) => {
  const redis = getRedis();
  
  if (checkRedisAvailable()) {
    await redis.del(key);
  } else {
    // 内存锁
    memoryLocks.delete(key);
  }
};

// 带锁执行函数
const withLock = async (key, fn, ttl = 10000) => {
  const lockKey = `lock:${key}`;
  const acquired = await acquireLock(lockKey, ttl);
  
  if (!acquired) {
    throw new Error('获取锁失败，请稍后重试');
  }
  
  try {
    return await fn();
  } finally {
    await releaseLock(lockKey);
  }
};

module.exports = {
  acquireLock,
  releaseLock,
  withLock,
};
