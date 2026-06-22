import { createClient } from 'redis';
import { loadProjectEnv } from '../utils/loadEnv.js';

loadProjectEnv();

const memoryRedisClient = {
  isMemoryClient: true,
  async connect() {
    return this;
  },
  async quit() {
    return undefined;
  },
  on() {
    return this;
  },
};

const useMemoryRedis = (process.env.REDIS_MODE || 'memory').toLowerCase() !== 'external';

const redisClient = useMemoryRedis
  ? memoryRedisClient
  : createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
    });

if (!useMemoryRedis) {
  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
  });
}

export const connectRedis = async () => {
  try {
    if (useMemoryRedis) {
      console.log('Redis 已切换为本地内存模式');
      return redisClient;
    }
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export default redisClient;
