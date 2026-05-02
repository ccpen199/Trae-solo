import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_PATH || path.join(__dirname, '../data/app.sqlite'),
  entities: [path.join(__dirname, 'entities/**/*{.js,.ts}')],
  migrations: [path.join(__dirname, 'migrations/**/*{.js,.ts}')],
  synchronize: true,
  logging: false,
});
