const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

let redis = null;

function createRedisClient() {
  const redisConfig = {
    host: config.redis.host,
    port: config.redis.port,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis connection failed after 3 retries, using fallback mode');
        return null;
      }
      return Math.min(times * 100, 1000);
    }
  };
  
  if (config.redis.password) {
    redisConfig.password = config.redis.password;
  }
  
  const client = new Redis(redisConfig);
  
  client.on('connect', () => {
    logger.info('Redis connected successfully');
  });
  
  client.on('error', (err) => {
    logger.error('Redis connection error:', err.message);
  });
  
  client.on('ready', () => {
    logger.info('Redis client ready');
  });
  
  return client;
}

function getRedisClient() {
  if (!redis) {
    redis = createRedisClient();
  }
  return redis;
}

const safeRedis = {
  async get(key) {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.warn('Redis get failed, using fallback:', err.message);
      return null;
    }
  },
  
  async set(key, value, expireSeconds = null) {
    try {
      const client = getRedisClient();
      const stringValue = JSON.stringify(value);
      if (expireSeconds) {
        await client.setex(key, expireSeconds, stringValue);
      } else {
        await client.set(key, stringValue);
      }
      return true;
    } catch (err) {
      logger.warn('Redis set failed:', err.message);
      return false;
    }
  },
  
  async del(key) {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (err) {
      logger.warn('Redis del failed:', err.message);
      return false;
    }
  },
  
  async exists(key) {
    try {
      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (err) {
      logger.warn('Redis exists failed:', err.message);
      return false;
    }
  }
};

module.exports = { getRedisClient, safeRedis };
