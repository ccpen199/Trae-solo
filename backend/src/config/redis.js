require('dotenv').config();
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_PASSWORD 
    ? `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    : `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connection established successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    console.log('Running without Redis cache (local fallback)');
  }
};

const getCache = async (key) => {
  try {
    if (!redisClient.isOpen) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

const setCache = async (key, value, expirationSeconds = 3600) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.setEx(key, expirationSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error);
  }
};

const delCache = async (key) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
};

module.exports = {
  redisClient,
  connectRedis,
  getCache,
  setCache,
  delCache
};