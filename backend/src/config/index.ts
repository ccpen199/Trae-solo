import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV 
  ? `.env.${process.env.NODE_ENV}` 
  : '.env';

const envPath = path.resolve(process.cwd(), envFile);
dotenv.config({ path: envPath });

export const config = {
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isPreview: process.env.NODE_ENV === 'preview',
  isTest: process.env.NODE_ENV === 'test',
  isMock: process.env.NODE_ENV === 'mock',
  mockEnabled: process.env.MOCK_ENABLED === 'true',
  
  port: parseInt(process.env.PORT || '8432', 10),
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380', 10),
    password: process.env.REDIS_PASSWORD,
  },
  
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
