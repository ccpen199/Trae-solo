import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'test' 
  ? '.env.test'
  : process.env.NODE_ENV === 'preview'
  ? '.env.preview'
  : process.env.NODE_ENV === 'mock'
  ? '.env.mock'
  : '.env';

dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '47291', 10),
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '47294', 10),
    user: process.env.DB_USER || 'email_marketing',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'email_marketing',
    url: process.env.DATABASE_URL || '',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '47293', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'no-reply@example.com',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  tracking: {
    baseUrl: process.env.TRACKING_BASE_URL || `http://localhost:${parseInt(process.env.PORT || '47291', 10)}`,
  },
  
  batch: {
    maxPerBatch: parseInt(process.env.BATCH_MAX_PER_BATCH || '1000', 10),
    delayBetweenBatches: parseInt(process.env.BATCH_DELAY_MS || '1000', 10),
    concurrentSends: parseInt(process.env.BATCH_CONCURRENT || '10', 10),
  },
};

export const isDevelopment = config.env === 'development';
export const isTest = config.env === 'test';
export const isPreview = config.env === 'preview';
export const isMock = config.env === 'mock';
export const isProduction = config.env === 'production';
