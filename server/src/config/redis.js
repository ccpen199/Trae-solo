const Redis = require('ioredis');
require('dotenv').config();

let redisClient = null;

const getRedisClient = () => {
  if (redisClient) return redisClient;
  
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redisClient.on('connect', () => {
    console.log('Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  return redisClient;
};

const getWithFallback = async (key, fallbackFn, ttl = 300) => {
  try {
    const client = getRedisClient();
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const result = await fallbackFn();
    if (result !== undefined && result !== null) {
      await client.setex(key, ttl, JSON.stringify(result));
    }
    return result;
  } catch (err) {
    console.warn('Redis fallback: querying directly', err.message);
    return await fallbackFn();
  }
};

module.exports = { getRedisClient, getWithFallback };
