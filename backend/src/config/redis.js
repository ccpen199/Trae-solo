const { createClient } = require('redis');
require('dotenv').config();

let redisClient = null;
let isRedisAvailable = false;

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.expires = new Map();
  }

  async set(key, value, options = {}) {
    this.cache.set(key, value);
    if (options.EX) {
      this.expires.set(key, Date.now() + options.EX * 1000);
    }
    return 'OK';
  }

  async get(key) {
    const expireTime = this.expires.get(key);
    if (expireTime && Date.now() > expireTime) {
      this.cache.delete(key);
      this.expires.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  async incr(key) {
    const current = parseInt(await this.get(key)) || 0;
    const newValue = current + 1;
    await this.set(key, newValue.toString());
    return newValue;
  }

  async del(key) {
    this.cache.delete(key);
    this.expires.delete(key);
    return 1;
  }

  async keys(pattern) {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return Array.from(this.cache.keys()).filter(k => regex.test(k));
  }
}

const memoryCache = new MemoryCache();

async function initRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || 
      `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log('Redis 连接失败，切换到内存缓存模式');
            isRedisAvailable = false;
            return false;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.log('Redis 连接错误:', err.message);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis 连接成功');
      isRedisAvailable = true;
    });

    await redisClient.connect();
    isRedisAvailable = true;
    console.log('Redis 初始化完成');
  } catch (error) {
    console.log('Redis 初始化失败，使用内存缓存模式:', error.message);
    isRedisAvailable = false;
  }
}

async function getCache() {
  if (isRedisAvailable && redisClient) {
    return redisClient;
  }
  return memoryCache;
}

module.exports = {
  initRedis,
  getCache,
  isRedisAvailable: () => isRedisAvailable
};
