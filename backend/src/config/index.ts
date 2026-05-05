import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '12263', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/jinzhongzi?schema=public',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'jinzhongzi_jwt_secret_key_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  },
  
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:22631,http://localhost:22632').split(','),
  },
  
  queue: {
    prefix: process.env.QUEUE_PREFIX || 'jinzhongzi',
  },
  
  frontend: {
    webPort: parseInt(process.env.FRONTEND_WEB_PORT || '22631', 10),
    adminPort: parseInt(process.env.FRONTEND_ADMIN_PORT || '22632', 10),
  },
};
