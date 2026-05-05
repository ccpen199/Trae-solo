const { createClient } = require('redis');
require('dotenv').config({ path: '../../.env' });

const redisClient = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => {
  console.error('Redis 连接错误:', err);
});

redisClient.on('connect', () => {
  console.log('Redis 连接成功');
});

redisClient.on('ready', () => {
  console.log('Redis 已就绪');
});

module.exports = redisClient;
