import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

const envPath = path.resolve(process.cwd(), '../../.env');
dotenv.config({ path: envPath });

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'iot_admin',
  password: process.env.DB_PASSWORD || 'iot_secure_pwd_2024',
  database: process.env.DB_NAME || 'iot_platform',
  entities: [path.join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '../database/migrations/**/*.{ts,js}')],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true',
  extra: {
    max: 50,
    connectionTimeoutMillis: 5000,
  },
};

export default new DataSource(typeOrmConfig);
