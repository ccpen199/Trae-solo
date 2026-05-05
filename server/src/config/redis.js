require('dotenv').config();
const redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_PASSWORD 
      ? `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
      : `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

    redisClient = redis.createClient({
      url: redisUrl
    });

    redisClient.on('error', (err) => {
      console.log('Redis连接错误:', err.message);
      console.log('使用本地缓存降级方案');
    });

    redisClient.on('connect', () => {
      console.log('Redis连接成功');
    });

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.log('Redis连接失败，使用本地内存缓存:', err.message);
    return null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

// 本地内存缓存降级方案
const localCache = new Map();

const setCache = async (key, value, ttl = 3600) => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  if (redisClient && redisClient.isOpen) {
    await redisClient.setEx(key, ttl, stringValue);
  } else {
    localCache.set(key, {
      value: stringValue,
      expireAt: Date.now() + ttl * 1000
    });
  }
};

const getCache = async (key) => {
  if (redisClient && redisClient.isOpen) {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } else {
    const cached = localCache.get(key);
    if (cached && cached.expireAt > Date.now()) {
      return JSON.parse(cached.value);
    }
    localCache.delete(key);
    return null;
  }
};

const deleteCache = async (key) => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.del(key);
  } else {
    localCache.delete(key);
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache
};
