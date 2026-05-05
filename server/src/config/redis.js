const Redis = require('ioredis');
require('dotenv').config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    try {
      redisClient = new Redis(redisConfig);
      redisClient.on('connect', () => {
        console.log('Redis 连接成功');
      });
      redisClient.on('error', (err) => {
        console.error('Redis 连接失败:', err.message);
        console.log('将在无 Redis 模式下运行...');
      });
    } catch (error) {
      console.error('创建 Redis 客户端失败:', error.message);
      console.log('将在无 Redis 模式下运行...');
    }
  }
  return redisClient;
};

module.exports = { getRedisClient, redisConfig };