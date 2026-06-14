import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '../data/app.sqlite'),
  synchronize: true,
  logging: false,
  entities: [path.join(__dirname, '/entities/**/*.{ts,js}')],
  migrations: [path.join(__dirname, '/migrations/**/*.{ts,js}')],
  subscribers: [path.join(__dirname, '/subscribers/**/*.{ts,js}')]
});
