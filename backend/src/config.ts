import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '127.0.0.1',
  ocppPort: parseInt(process.env.OCPP_PORT || '3002', 10),
  dbPath: process.env.DB_PATH || path.join(__dirname, '../data/charging.db'),
  nodeEnv: process.env.NODE_ENV || 'development',
};
