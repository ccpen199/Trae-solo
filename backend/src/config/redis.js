require('dotenv').config();
const { createClient } = require('redis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

let redisClient = null;

const getRedisClient = async () => {
  if (!redisClient || !redisClient.isOpen) {
    try {
      redisClient = createClient(redisConfig);
      redisClient.on('error', (err) => {
        console.error('Redis client error:', err);
      });
      redisClient.on('connect', () => {
        console.log('Redis client connected');
      });
      await redisClient.connect();
    } catch (error) {
      console.warn('Redis connection failed, running in degraded mode:', error.message);
      redisClient = null;
    }
  }
  return redisClient;
};

const isRedisAvailable = () => {
  return redisClient && redisClient.isOpen;
};

const set = async (key, value, options = {}) => {
  const client = await getRedisClient();
  if (!client) return null;
  try {
    if (options.EX) {
      return await client.set(key, value, { EX: options.EX });
    }
    return await client.set(key, value);
  } catch (error) {
    console.warn('Redis set failed:', error.message);
    return null;
  }
};

const get = async (key) => {
  const client = await getRedisClient();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch (error) {
    console.warn('Redis get failed:', error.message);
    return null;
  }
};

const del = async (key) => {
  const client = await getRedisClient();
  if (!client) return null;
  try {
    return await client.del(key);
  } catch (error) {
    console.warn('Redis del failed:', error.message);
    return null;
  }
};

const decr = async (key) => {
  const client = await getRedisClient();
  if (!client) return null;
  try {
    return await client.decr(key);
  } catch (error) {
    console.warn('Redis decr failed:', error.message);
    return null;
  }
};

const incr = async (key) => {
  const client = await getRedisClient();
  if (!client) return null;
  try {
    return await client.incr(key);
  } catch (error) {
    console.warn('Redis incr failed:', error.message);
    return null;
  }
};

const setNX = async (key, value) => {
  const client = await getRedisClient();
  if (!client) return false;
  try {
    return await client.setNX(key, value);
  } catch (error) {
    console.warn('Redis setNX failed:', error.message);
    return false;
  }
};

const expire = async (key, seconds) => {
  const client = await getRedisClient();
  if (!client) return false;
  try {
    return await client.expire(key, seconds);
  } catch (error) {
    console.warn('Redis expire failed:', error.message);
    return false;
  }
};

module.exports = {
  getRedisClient,
  isRedisAvailable,
  set,
  get,
  del,
  decr,
  incr,
  setNX,
  expire,
};
