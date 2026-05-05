import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 20789,
  databaseUrl: process.env.DATABASE_URL || 'file:./data/app.sqlite',
  secretKey: process.env.SECRET_KEY || 'default_secret_key',
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
  
  appId: process.env.APP_ID || 'channel_collision_app',
  version: process.env.VERSION || '1.0.0',
  
  memberCenterUrl: process.env.MEMBER_CENTER_URL || 'http://localhost:20789/mock/member-center',
  riskCheckUrl: process.env.RISK_CHECK_URL || 'http://localhost:20789/mock/risk-check',
  userActivityUrl: process.env.USER_ACTIVITY_URL || 'http://localhost:20789/mock/user-activity',
  
  downloadUrls: {
    test: {
      new: process.env.TEST_DOWNLOAD_URL_NEW || 'http://localhost:30789/download/test-new',
      old: process.env.TEST_DOWNLOAD_URL_OLD || 'http://localhost:30789/download/test-old'
    },
    prod: {
      new: process.env.PROD_DOWNLOAD_URL_NEW || 'https://example.com/download/prod-new',
      old: process.env.PROD_DOWNLOAD_URL_OLD || 'https://example.com/download/prod-old'
    }
  },
  
  apiKeys: {
    test: process.env.TEST_API_KEY || 'test_api_key_123456',
    prod: process.env.PROD_API_KEY || 'prod_api_key_abcdef'
  },
  
  blacklistDays: parseInt(process.env.BLACKLIST_DAYS) || 90,
  minClearDays: parseInt(process.env.MIN_CLEAR_DAYS) || 30,
  
  logLevel: process.env.LOG_LEVEL || 'info',
  
  isTestEnv: () => config.env === 'development' || config.env === 'test',
  isProdEnv: () => config.env === 'production',
  
  getDownloadUrl: (isNewUser) => {
    const env = config.isTestEnv() ? 'test' : 'prod';
    const userType = isNewUser ? 'new' : 'old';
    return config.downloadUrls[env][userType];
  },
  
  getApiKey: () => {
    return config.isTestEnv() ? config.apiKeys.test : config.apiKeys.prod;
  }
};

export default config;
