import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'sms_admin',
    password: process.env.DB_PASSWORD || 'SmsAdmin@2024',
    database: process.env.DB_NAME || 'sms_platform',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  services: {
    gateway: {
      port: parseInt(process.env.GATEWAY_PORT || '9823'),
    },
    template: {
      port: parseInt(process.env.TEMPLATE_SERVICE_PORT || '9830'),
    },
    smsSender: {
      port: parseInt(process.env.SMS_SENDER_SERVICE_PORT || '9831'),
    },
    routing: {
      port: parseInt(process.env.ROUTING_ENGINE_PORT || '9832'),
    },
    frequency: {
      port: parseInt(process.env.FREQUENCY_ENGINE_PORT || '9833'),
    },
    receipt: {
      port: parseInt(process.env.RECEIPT_ENGINE_PORT || '9834'),
    },
    compliance: {
      port: parseInt(process.env.COMPLIANCE_ENGINE_PORT || '9835'),
    },
    audit: {
      port: parseInt(process.env.AUDIT_SERVICE_PORT || '9836'),
    },
    finance: {
      port: parseInt(process.env.FINANCE_SERVICE_PORT || '9837'),
    },
    web: {
      port: parseInt(process.env.WEB_PORT || '9824'),
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'SmsPlatformJwtSecretKey2024VeryLongAndSecure',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
  env: process.env.NODE_ENV || 'development',
};
