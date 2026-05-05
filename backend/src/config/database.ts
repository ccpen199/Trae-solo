import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Enterprise } from '../entities/Enterprise';
import { LogisticsOrder } from '../entities/LogisticsOrder';
import { OperationLog } from '../entities/OperationLog';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const dbType = (process.env.DB_TYPE || 'postgres') as 'postgres' | 'sqlite';

let dataSourceConfig: any;

if (dbType === 'sqlite') {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  dataSourceConfig = {
    type: 'sqlite',
    database: path.join(dataDir, 'logistics_platform.db'),
    entities: [User, Enterprise, LogisticsOrder, OperationLog],
    synchronize: true,
    logging: process.env.NODE_ENV === 'development',
  };
} else {
  dataSourceConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'logistics_platform',
    entities: [User, Enterprise, LogisticsOrder, OperationLog],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
}

export const AppDataSource = new DataSource(dataSourceConfig);
