import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.GATEWAY_PORT || '9823'),
  jwt: {
    secret: process.env.JWT_SECRET || 'SmsPlatformJwtSecretKey2024VeryLongAndSecure',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
  env: process.env.NODE_ENV || 'development',
  database: {
    path: process.env.SQLITE_PATH || path.resolve(__dirname, '../../data/sms-platform-v3.db'),
  },
};
