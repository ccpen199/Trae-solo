const { createClient } = require('redis');
require('dotenv').config();

let redisClient = null;
let redisAvailable = false;

const initRedis = async () => {
  try {
    const redisConfig = {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      },
    };
    
    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }
    
    redisClient = createClient(redisConfig);
    
    redisClient.on('error', (err) => {
      console.log('Redis连接错误:', err.message);
      redisAvailable = false;
    });
    
    redisClient.on('connect', () => {
      console.log('Redis连接成功');
      redisAvailable = true;
    });
    
    await redisClient.connect();
    redisAvailable = true;
  } catch (err) {
    console.log('Redis初始化失败，将使用内存缓存:', err.message);
    redisAvailable = false;
  }
};

const getCache = async (key) => {
  if (!redisAvailable) {
    return null;
  }
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.log('Redis读取错误:', err.message);
    return null;
  }
};

const setCache = async (key, value, ttl = 3600) => {
  if (!redisAvailable) {
    return;
  }
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.log('Redis写入错误:', err.message);
  }
};

const deleteCache = async (key) => {
  if (!redisAvailable) {
    return;
  }
  try {
    await redisClient.del(key);
  } catch (err) {
    console.log('Redis删除错误:', err.message);
  }
};

module.exports = {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  redisAvailable: () => redisAvailable,
};
