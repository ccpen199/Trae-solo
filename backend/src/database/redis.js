require('dotenv').config();
const redis = require('redis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

let redisClient = null;

const getRedisClient = async () => {
  if (redisClient && redisClient.isReady) {
    return redisClient;
  }

  try {
    redisClient = redis.createClient(redisConfig);
    
    redisClient.on('error', (err) => {
      console.error('Redis 连接错误:', err.message);
      console.log('Redis 降级模式启用 - 将不使用缓存');
    });

    redisClient.on('connect', () => {
      console.log('Redis 连接成功');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.warn('Redis 连接失败，降级模式启用:', error.message);
    return null;
  }
};

module.exports = { getRedisClient };
