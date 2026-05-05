import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

let redisClient = null;
let isConnected = false;

export const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 
    `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}/${process.env.REDIS_DB || 0}`;

  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on('error', (err) => {
    console.error('Redis连接错误:', err);
    isConnected = false;
  });

  redisClient.on('connect', () => {
    console.log('Redis连接成功');
    isConnected = true;
  });

  try {
    await redisClient.connect();
    isConnected = true;
  } catch (err) {
    console.warn('Redis连接失败，将使用内存缓存模式:', err.message);
    isConnected = false;
  }

  return redisClient;
};

export const getRedisClient = () => {
  return redisClient;
};

export const isRedisConnected = () => {
  return isConnected;
};

// 降级方案：内存缓存
const memoryCache = new Map();

export const cacheGet = async (key) => {
  if (isConnected && redisClient) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.warn('Redis获取失败，使用内存缓存:', err.message);
    }
  }
  return memoryCache.get(key) || null;
};

export const cacheSet = async (key, value, ttlSeconds = 3600) => {
  const serialized = JSON.stringify(value);
  
  if (isConnected && redisClient) {
    try {
      await redisClient.setEx(key, ttlSeconds, serialized);
      return;
    } catch (err) {
      console.warn('Redis设置失败，使用内存缓存:', err.message);
    }
  }
  
  memoryCache.set(key, value);
  setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
};

export const cacheDel = async (key) => {
  if (isConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.warn('Redis删除失败:', err.message);
    }
  }
  memoryCache.delete(key);
};
