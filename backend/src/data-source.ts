import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: path.join(__dirname, '../data/app.sqlite'),
  synchronize: true,
  logging: false,
  entities: [path.join(__dirname, './models/*.{ts,js}')],
  migrations: [],
  subscribers: [],
  prepareDatabase: (db) => {
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  },
});
