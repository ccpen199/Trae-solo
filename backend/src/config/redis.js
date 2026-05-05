const redis = require('redis');
require('dotenv').config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

const createClient = async () => {
  const client = redis.createClient(redisConfig);
  
  client.on('error', (err) => {
    console.error('Redis 连接错误:', err);
  });
  
  client.on('connect', () => {
    console.log('Redis 连接成功');
  });
  
  await client.connect();
  return client;
};

let redisClient = null;

const getClient = async () => {
  if (!redisClient) {
    redisClient = await createClient();
  }
  return redisClient;
};

module.exports = {
  redisConfig,
  createClient,
  getClient,
};
