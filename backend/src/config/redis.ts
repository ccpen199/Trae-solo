import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: RedisClientType | null = null;
let isConnected = false;

export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

export const connectRedis = async (): Promise<RedisClientType | null> => {
  if (isConnected && redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_PASSWORD
    ? `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
    : `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

  try {
    redisClient = createClient({ url: redisUrl });
    
    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });

    await redisClient.connect();
    isConnected = true;
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis, running in degraded mode:', error);
    return null;
  }
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    isConnected = false;
  }
};
