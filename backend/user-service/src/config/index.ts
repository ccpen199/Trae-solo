import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '9877', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'video_platform',
    user: process.env.DB_USER || 'vp_admin',
    password: process.env.DB_PASSWORD || 'Vp_Admin_2024_Secure',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '86400', 10),
    refreshExpiresIn: 604800,
  },

  password: {
    saltRounds: 10,
    minLength: 8,
    maxLength: 128,
  },

  cache: {
    userTTL: 300,
    sessionTTL: 86400,
  },
};
