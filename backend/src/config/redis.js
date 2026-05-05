const { createClient } = require('redis');
require('dotenv').config();

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    const options = {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.warn('Redis 连接失败，切换到内存模式...');
            return null;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    };
    
    if (process.env.REDIS_PASSWORD) {
      options.password = process.env.REDIS_PASSWORD;
    }
    
    redisClient = createClient(options);
    
    redisClient.on('error', (err) => {
      console.error('Redis 错误:', err.message);
    });
    
    redisClient.on('connect', () => {
      console.log('Redis 连接成功');
    });
  }
  return redisClient;
};

const connectRedis = async () => {
  try {
    const client = getRedisClient();
    await client.connect();
    return client;
  } catch (err) {
    console.warn('Redis 连接失败，使用内存缓存替代:', err.message);
    return null;
  }
};

module.exports = { getRedisClient, connectRedis };
