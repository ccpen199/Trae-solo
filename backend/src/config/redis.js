const redis = require('redis');
require('dotenv').config();

let redisClient = null;
let useFallback = false;

const initRedis = async () => {
  try {
    const client = redis.createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        connectTimeout: 5000
      }
    });

    client.on('error', (err) => {
      console.error('Redis连接错误:', err);
      useFallback = true;
    });

    await client.connect();
    redisClient = client;
    console.log('Redis连接成功');
    return client;
  } catch (error) {
    console.error('Redis初始化失败，启用内存缓存降级方案:', error.message);
    useFallback = true;
    return null;
  }
};

// 内存缓存降级方案
const memoryCache = new Map();

const set = async (key, value, ttlSeconds = 3600) => {
  if (useFallback || !redisClient) {
    memoryCache.set(key, { value, expireAt: Date.now() + ttlSeconds * 1000 });
    return;
  }
  await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
};

const get = async (key) => {
  if (useFallback || !redisClient) {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (item.expireAt < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  }
  const result = await redisClient.get(key);
  return result ? JSON.parse(result) : null;
};

const del = async (key) => {
  if (useFallback || !redisClient) {
    memoryCache.delete(key);
    return;
  }
  await redisClient.del(key);
};

module.exports = {
  initRedis,
  redisClient,
  set,
  get,
  del
};
