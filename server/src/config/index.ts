import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const findEnv = () => {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
};
dotenv.config({ path: findEnv(), override: true });

export const config = {
  server: {
    port: parseInt(process.env.SERVER_PORT || '3000'),
    host: process.env.SERVER_HOST || '127.0.0.1',
    env: process.env.NODE_ENV || 'development'
  },
  db: {
    type: process.env.DB_TYPE || 'sqlite',
    path: process.env.DB_PATH || './data/app.db'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-please-change-in-prod-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  gov: {
    url: process.env.GOV_PLATFORM_URL || 'https://api.province-gov.example.com',
    appId: process.env.GOV_PLATFORM_APP_ID || 'DEV_APP_001',
    appSecret: process.env.GOV_PLATFORM_APP_SECRET || 'DEV_SECRET_2024'
  },
  crypto: {
    sm2Private: process.env.SM2_PRIVATE_KEY || './certs/sm2_private.pem',
    sm2Public: process.env.SM2_PUBLIC_KEY || './certs/sm2_public.pem',
    sm4Key: process.env.SM4_KEY || '0123456789abcdef0123456789abcdef'
  },
  tsa: {
    url: process.env.TSA_SERVER_URL || 'https://tsa.example.com',
    username: process.env.TSA_USERNAME || 'dev',
    password: process.env.TSA_PASSWORD || 'dev123'
  },
  storage: {
    type: process.env.CLOUD_STORAGE_TYPE || 'local',
    localDir: path.resolve(__dirname, '../uploads')
  }
};

export default config;
