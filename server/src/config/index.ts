import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export interface Config {
  server: {
    port: number;
    nodeEnv: string;
    apiPrefix: string;
  };
  database: {
    type: string;
    synchronize: boolean;
    logging: boolean;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  system: {
    logLevel: string;
    maxConcurrentProjects: number;
  };
  coupon: {
    defaultValidityDays: number;
    maxCouponsPerUser: number;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '28443', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api/v1'
  },
  database: {
    type: process.env.DB_TYPE || 'better-sqlite3',
    synchronize: process.env.DB_SYNC !== 'false',
    logging: process.env.DB_LOGGING === 'true',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'coupon_admin',
    password: process.env.DB_PASSWORD || 'Coupon@Admin2024',
    database: process.env.DB_NAME || 'coupon_marketing'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'coupon-marketing-jwt-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  system: {
    logLevel: process.env.LOG_LEVEL || 'debug',
    maxConcurrentProjects: parseInt(process.env.MAX_CONCURRENT_PROJECTS || '10', 10)
  },
  coupon: {
    defaultValidityDays: parseInt(process.env.DEFAULT_COUPON_VALIDITY_DAYS || '30', 10),
    maxCouponsPerUser: parseInt(process.env.MAX_COUPONS_PER_USER || '10', 10)
  }
};

export default config;
