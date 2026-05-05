require('dotenv').config();
const { createClient } = require('redis');

const redisConfig = {
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
};

if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

let redisClient = null;
let redisAvailable = true;

const initRedis = async () => {
  try {
    redisClient = createClient(redisConfig);
    
    redisClient.on('error', (err) => {
      console.error('Redis连接错误:', err.message);
      redisAvailable = false;
    });
    
    redisClient.on('connect', () => {
      console.log('Redis连接成功');
      redisAvailable = true;
    });
    
    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.error('Redis初始化失败，将使用降级方案:', err.message);
    redisAvailable = false;
    return null;
  }
};

const getRedis = () => redisClient;
const isRedisAvailable = () => redisAvailable;

const cacheWrapper = {
  get: async (key) => {
    if (!redisAvailable || !redisClient) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Redis get失败:', err.message);
      return null;
    }
  },
  set: async (key, value, ttl = 300) => {
    if (!redisAvailable || !redisClient) return;
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: ttl });
    } catch (err) {
      console.error('Redis set失败:', err.message);
    }
  },
  del: async (key) => {
    if (!redisAvailable || !redisClient) return;
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error('Redis del失败:', err.message);
    }
  }
};

module.exports = {
  initRedis,
  getRedis,
  isRedisAvailable,
  cacheWrapper
};
