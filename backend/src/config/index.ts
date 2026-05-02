import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  server: {
    port: parseInt(process.env.SERVER_PORT || '18723', 10),
    host: process.env.SERVER_HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'emr_jwt_secret_key_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  database: {
    type: (process.env.DB_TYPE || 'sqlite') as 'pg' | 'sqlite',
    filename: process.env.DB_FILENAME || './data/emr_system.db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '18725', 10),
    user: process.env.DB_USER || 'emr_user',
    password: process.env.DB_PASSWORD || 'emr_secure_password_2024',
    database: process.env.DB_NAME || 'emr_system',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '18726', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  websocket: {
    port: parseInt(process.env.WS_PORT || '18727', 10),
  },

  cdss: {
    enabled: process.env.CDSS_ENABLED === 'true',
    autoValidate: process.env.CDSS_AUTO_VALIDATE === 'true',
  },

  eSign: {
    caEnabled: process.env.E_SIGN_CA_ENABLED === 'true',
    keyPath: process.env.E_SIGN_KEY_PATH || './certs/private.key',
    certPath: process.env.E_SIGN_CERT_PATH || './certs/certificate.pem',
  },

  audit: {
    enabled: process.env.AUDIT_LOG_ENABLED === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  fileUpload: {
    path: process.env.FILE_UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  },

  pdf: {
    outputPath: process.env.PDF_OUTPUT_PATH || './archive',
  },
};

export type Config = typeof config;

export default config;
