import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.BACKEND_PORT || '59168', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://127.0.0.1:49168',
  jwtSecret: process.env.JWT_SECRET || 'enterprise-workstation-secret-key-2024',
  dbPath: path.resolve(__dirname, '../../', process.env.DB_PATH || './data/app.sqlite'),
  uploadDir: path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || './uploads'),
};
