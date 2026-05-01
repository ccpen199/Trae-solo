import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
});

export default redisClient;
