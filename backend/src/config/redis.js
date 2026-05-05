const Redis = require('ioredis');
require('dotenv').config();

let redisClient = null;
let isConnected = false;

const createRedisClient = () => {
  if (process.env.REDIS_ENABLED !== 'true') {
    console.log('ℹ️ Redis 已禁用，使用内存缓存');
    return null;
  }

  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryStrategy: (times) => {
      if (times > 3) {
        console.log('ℹ️ Redis 连接失败，切换到内存缓存模式');
        return null;
      }
      return Math.min(times * 100, 3000);
    }
  };

  if (process.env.REDIS_PASSWORD) {
    redisConfig.password = process.env.REDIS_PASSWORD;
  }

  return new Redis(redisConfig);
};

const initRedis = async () => {
  try {
    redisClient = createRedisClient();
    
    if (!redisClient) {
      isConnected = false;
      return;
    }

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('✅ Redis 连接成功');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      console.log('ℹ️ Redis 连接错误:', err.message);
    });

    redisClient.on('end', () => {
      isConnected = false;
    });

    await redisClient.ping();
  } catch (error) {
    console.log('ℹ️ Redis 初始化失败:', error.message);
    isConnected = false;
  }
};

const memoryCache = new Map();

const cache = {
  async get(key) {
    if (isConnected && redisClient) {
      try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } catch (err) {
        console.log('ℹ️ Redis get 失败，使用内存缓存');
      }
    }
    return memoryCache.get(key) || null;
  },

  async set(key, value, ttl = 3600) {
    if (isConnected && redisClient) {
      try {
        await redisClient.setex(key, ttl, JSON.stringify(value));
        return;
      } catch (err) {
        console.log('ℹ️ Redis set 失败，使用内存缓存');
      }
    }
    memoryCache.set(key, value);
    setTimeout(() => memoryCache.delete(key), ttl * 1000);
  },

  async del(key) {
    if (isConnected && redisClient) {
      try {
        await redisClient.del(key);
        return;
      } catch (err) {
        console.log('ℹ️ Redis del 失败');
      }
    }
    memoryCache.delete(key);
  },

  async keys(pattern) {
    if (isConnected && redisClient) {
      try {
        return await redisClient.keys(pattern);
      } catch (err) {
        console.log('ℹ️ Redis keys 失败');
      }
    }
    return Array.from(memoryCache.keys()).filter(k => k.includes(pattern.replace('*', '')));
  }
};

module.exports = {
  redisClient,
  initRedis,
  cache,
  isConnected: () => isConnected
};
