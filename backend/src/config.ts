import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const frontendPort = parseInt(process.env.FRONTEND_PORT || '48935', 10);

export const config = {
  port: parseInt(process.env.BACKEND_PORT || '58935', 10),
  dbPath: process.env.DB_PATH || './data/app.sqlite',
  jwtSecret: process.env.JWT_SECRET || 'smart-laundry-iot-secret-key-2024',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || `http://127.0.0.1:${frontendPort}`,
  bindHost: '127.0.0.1'
};

export default config;
