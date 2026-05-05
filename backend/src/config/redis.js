require('dotenv').config();
const Redis = require('ioredis');

let redisClient = null;
let isRedisAvailable = false;

const createRedisClient = () => {
  if (redisClient) return redisClient;
  
  const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      if (times > 3) {
        console.log('Redis连接失败，切换到内存存储模式');
        isRedisAvailable = false;
        return null;
      }
      return Math.min(times * 100, 2000);
    }
  };

  redisClient = new Redis(redisOptions);

  redisClient.on('connect', () => {
    console.log('Redis连接成功');
    isRedisAvailable = true;
  });

  redisClient.on('error', (err) => {
    console.log('Redis连接错误:', err.message);
    isRedisAvailable = false;
  });

  return redisClient;
};

const getRedisStatus = () => isRedisAvailable;

// 内存存储降级方案
class MemoryStore {
  constructor() {
    this.store = new Map();
  }
  
  async get(key) {
    return this.store.get(key) || null;
  }
  
  async set(key, value, ttl) {
    this.store.set(key, value);
    if (ttl) {
      setTimeout(() => this.store.delete(key), ttl * 1000);
    }
    return 'OK';
  }
  
  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }
  
  async exists(key) {
    return this.store.has(key) ? 1 : 0;
  }
  
  async expire(key, seconds) {
    const value = this.store.get(key);
    if (value) {
      setTimeout(() => this.store.delete(key), seconds * 1000);
      return 1;
    }
    return 0;
  }
}

const memoryStore = new MemoryStore();

const getClient = () => {
  if (isRedisAvailable && redisClient) {
    return redisClient;
  }
  return memoryStore;
};

module.exports = {
  createRedisClient,
  getRedisStatus,
  getClient
};
