import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: '7d',
  DB_PATH: path.resolve(process.cwd(), 'api', 'data', 'pickup.db'),
  freight: {
    basePrice: 8,
    pricePerKg: 2,
    insuranceRate: 0.005,
  },
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
  },
};
