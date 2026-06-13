import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

const envPath = path.resolve(process.cwd(), '../../.env');
dotenv.config({ path: envPath });

export const typeOrmConfig: DataSourceOptions = {
  type: 'sqlite',
  database: path.resolve(process.cwd(), './data/iot_platform.sqlite'),
  entities: [path.join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '../database/migrations/**/*.{ts,js}')],
  synchronize: true,
  logging: false,
  extra: {
    max: 50,
    connectionTimeoutMillis: 5000,
  },
};

export default new DataSource(typeOrmConfig);
