import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { DataType, newDb } from 'pg-mem';
import { v4 as uuidv4 } from 'uuid';
import { loadProjectEnv } from '../utils/loadEnv.js';

loadProjectEnv();

const entities = [__dirname + '/../entities/**/*.{ts,js}'];
const dbMode = (process.env.DB_MODE || 'memory').toLowerCase();

function createMemoryDataSource() {
  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });

  db.public.registerFunction({
    name: 'current_database',
    returns: DataType.text,
    implementation: () => 'pg_mem',
  });
  db.public.registerFunction({
    name: 'version',
    returns: DataType.text,
    implementation: () => 'PostgreSQL 16.0 (pg-mem)',
  });
  db.registerExtension('uuid-ossp', (schema) => {
    schema.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: uuidv4,
      impure: true,
    });
  });

  return db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities,
    synchronize: true,
    logging: false,
  });
}

export const AppDataSource =
  dbMode === 'external'
    ? new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'rider_dispatch',
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
        entities,
        migrations: [__dirname + '/../migrations/**/*.{ts,js}'],
        subscribers: [__dirname + '/../subscribers/**/*.{ts,js}'],
      })
    : createMemoryDataSource();
