import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '9876', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://hotel_pms:hotel_pms_password@localhost:54320/hotel_pms',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:63790',
  jwtSecret: process.env.JWT_SECRET || 'hotel-pms-jwt-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
};
