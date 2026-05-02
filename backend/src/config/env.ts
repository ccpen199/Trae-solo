import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

export const env = {
  BACKEND_PORT: parseInt(process.env.BACKEND_PORT || '9180'),
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:9180',
  FRONTEND_PORT: parseInt(process.env.FRONTEND_PORT || '9181'),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:9181',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./data/app.sqlite',
  JWT_SECRET: process.env.JWT_SECRET || 'bank-management-secret-key-2026-secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  BANK_SYNC_INTERVAL: parseInt(process.env.BANK_SYNC_INTERVAL || '5'),
  RECONCILIATION_INTERVAL: parseInt(process.env.RECONCILIATION_INTERVAL || '10'),
  BANK_CONNECTOR_MODE: process.env.BANK_CONNECTOR_MODE || 'SIMULATION',
};
