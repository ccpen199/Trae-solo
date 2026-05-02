import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  ports: {
    api: Number(process.env.PORT_API) || 18443,
    socket: Number(process.env.PORT_SOCKET) || 18444,
    client: Number(process.env.PORT_CLIENT) || 18445,
    reception: Number(process.env.PORT_RECEPTION) || 18446,
    doctor: Number(process.env.PORT_DOCTOR) || 18447,
    dashboard: Number(process.env.PORT_DASHBOARD) || 18448,
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'medical_exam',
    user: process.env.DB_USER || 'exam_admin',
    password: process.env.DB_PASSWORD || 'ExamPass2026!',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'MedicalExamJwtSecretKey2026VerySecure',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  defaultAccount: {
    adminUser: process.env.DEFAULT_ADMIN_USER || 'admin',
    adminPass: process.env.DEFAULT_ADMIN_PASS || 'Admin123!',
  },
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export type Config = typeof config;
