require('dotenv').config();
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('connect', () => {
  console.log('Redis connecting...');
});

redisClient.on('ready', () => {
  console.log('Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
  console.log('Running in fallback mode without Redis cache');
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err.message);
    console.log('Redis caching disabled - using database directly');
  }
};

module.exports = {
  redisClient,
  connectRedis,
  async getCache(key) {
    try {
      if (redisClient.isReady) {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (err) {
      console.error('Redis get error:', err.message);
    }
    return null;
  },
  async setCache(key, value, ttl = 300) {
    try {
      if (redisClient.isReady) {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
      }
    } catch (err) {
      console.error('Redis set error:', err.message);
    }
  },
  async deleteCache(key) {
    try {
      if (redisClient.isReady) {
        await redisClient.del(key);
      }
    } catch (err) {
      console.error('Redis delete error:', err.message);
    }
  },
};
