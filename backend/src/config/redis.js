const { createClient } = require('redis');
require('dotenv').config();

const redisConfig = {
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD || undefined
};

const redisClient = createClient(redisConfig);

redisClient.on('error', (err) => {
  console.error('Redis 连接错误:', err);
});

redisClient.on('connect', () => {
  console.log('Redis 连接成功');
});

redisClient.on('reconnecting', () => {
  console.log('Redis 正在重连...');
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis 已连接');
  } catch (err) {
    console.error('Redis 连接失败:', err);
  }
};

module.exports = {
  redisClient,
  connectRedis
};
