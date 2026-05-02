import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8765'),
  wsPort: parseInt(process.env.WS_PORT || '8766'),
  jwtSecret: process.env.JWT_SECRET || 'beauty-salon-jwt-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10'),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};

export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export const redis = new Redis(config.redisUrl);

export default config;
