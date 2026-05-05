const Redis = require('ioredis');
require('dotenv').config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

let redisClient = null;
let isConnected = false;

const connectRedis = async () => {
  try {
    redisClient = new Redis(redisConfig);
    
    redisClient.on('connect', () => {
      console.log('✓ Redis连接成功');
      isConnected = true;
    });

    redisClient.on('error', (err) => {
      console.warn('✗ Redis连接失败，将使用内存缓存替代:', err.message);
      isConnected = false;
    });

    redisClient.on('ready', () => {
      console.log('✓ Redis已就绪');
      isConnected = true;
    });

    return redisClient;
  } catch (error) {
    console.warn('✗ Redis初始化失败，将使用内存缓存替代');
    isConnected = false;
    return null;
  }
};

// 内存缓存作为Redis降级方案
const memoryCache = new Map();
const memoryCacheTTL = new Map();

const getClient = () => redisClient;

const isRedisConnected = () => isConnected;

// 统一的缓存接口
const cache = {
  set: async (key, value, ttl = 3600) => {
    if (isConnected && redisClient) {
      try {
        return redisClient.set(key, JSON.stringify(value), 'EX', ttl);
      } catch (err) {
        console.warn('Redis set失败，使用内存缓存');
      }
    }
    memoryCache.set(key, value);
    memoryCacheTTL.set(key, Date.now() + ttl * 1000);
    return 'OK';
  },

  get: async (key) => {
    if (isConnected && redisClient) {
      try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } catch (err) {
        console.warn('Redis get失败，使用内存缓存');
      }
    }
    // 检查内存缓存是否过期
    const ttl = memoryCacheTTL.get(key);
    if (ttl && ttl < Date.now()) {
      memoryCache.delete(key);
      memoryCacheTTL.delete(key);
      return null;
    }
    return memoryCache.get(key) || null;
  },

  del: async (key) => {
    if (isConnected && redisClient) {
      try {
        return redisClient.del(key);
      } catch (err) {
        console.warn('Redis del失败');
      }
    }
    memoryCache.delete(key);
    memoryCacheTTL.delete(key);
    return 1;
  },

  keys: async (pattern) => {
    if (isConnected && redisClient) {
      try {
        return redisClient.keys(pattern);
      } catch (err) {
        console.warn('Redis keys失败');
      }
    }
    // 内存缓存的简单匹配
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return Array.from(memoryCache.keys()).filter(k => regex.test(k));
  }
};

module.exports = {
  connectRedis,
  getClient,
  isRedisConnected,
  cache
};
