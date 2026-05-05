import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '12256', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'qq-chat-jwt-secret-key-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  postgres: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    database: process.env.PG_DB || 'qq_chat'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || ''
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:22256',
  useMemoryDb: process.env.USE_MEMORY_DB === 'true',
  useMemoryRedis: process.env.USE_MEMORY_REDIS === 'true'
};

export default config;
