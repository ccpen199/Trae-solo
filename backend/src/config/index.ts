import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  server: {
    port: parseInt(process.env.PORT || '18763'),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:16379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '16379'),
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'community-forum-jwt-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:28763').split(','),
  },
  
  reputation: {
    postReward: 10,
    commentReward: 2,
    likeReceivedReward: 1,
    likeGivenReward: 0,
    moderatorUnlockLevel: 10,
    levelUpBase: 100,
  },
  
  contentRanking: {
    decayRate: 0.1,
    hotScoreBase: 10000,
    likeWeight: 2,
    commentWeight: 5,
    shareWeight: 3,
    viewWeight: 0.1,
  },
  
  autoMod: {
    enabled: process.env.AUTO_MOD_ENABLED !== 'false',
    sensitivity: parseFloat(process.env.AUTO_MOD_SENSITIVITY || '0.7'),
  },
  
  rateLimit: {
    windowMs: 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  },
};

export default config;
