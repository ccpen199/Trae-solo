import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import configuration from '../config/configuration';

dotenv.config();

const config = configuration();
const isProduction = config.nodeEnv === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: !isProduction && config.database.sync,
  logging: config.database.logging,
  entities: [
    path.join(__dirname, '../modules/**/entities/*.entity.{ts,js}'),
    path.join(__dirname, '../common/**/entities/*.entity.{ts,js}'),
  ],
  migrations: [path.join(__dirname, './migrations/*.{ts,js}')],
  migrationsRun: isProduction,
  poolSize: config.database.host.includes('test') ? 5 : undefined,
  extra: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
      }
    : false,
});
