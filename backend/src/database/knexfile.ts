import type { Knex } from 'knex';
import { config } from '../config';
import path from 'path';
import fs from 'fs';

const isSqlite = config.database.type === 'sqlite';

const dataDir = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqliteConfig: Knex.Config = {
  client: 'better-sqlite3',
  connection: {
    filename: path.resolve(__dirname, '../../..', config.database.filename),
  },
  useNullAsDefault: true,
  migrations: {
    directory: './migrations-sqlite',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

const pgConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
  },
  pool: {
    min: config.database.pool.min,
    max: config.database.pool.max,
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

const knexConfig: { [key: string]: Knex.Config } = {
  development: isSqlite ? sqliteConfig : pgConfig,
  test: isSqlite ? sqliteConfig : {
    ...pgConfig,
    connection: {
      ...(typeof pgConfig.connection === 'object' ? pgConfig.connection : {}),
      database: 'emr_test',
    } as any,
  },
  production: isSqlite ? sqliteConfig : {
    ...pgConfig,
    connection: {
      ...(typeof pgConfig.connection === 'object' ? pgConfig.connection : {}),
      ssl: { rejectUnauthorized: false },
    } as any,
  },
};

export default knexConfig;
