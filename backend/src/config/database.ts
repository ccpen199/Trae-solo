import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bookstore',
};

const pool = new Pool(dbConfig);

export const createDatabaseIfNotExists = async (): Promise<boolean> => {
  const tempPool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: 'postgres',
  });

  try {
    const result = await tempPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbConfig.database]
    );

    if (result.rows.length === 0) {
      console.log(`Database "${dbConfig.database}" does not exist, creating...`);
      await tempPool.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`Database "${dbConfig.database}" created successfully`);
      return true;
    } else {
      console.log(`Database "${dbConfig.database}" already exists`);
      return false;
    }
  } catch (error: any) {
    console.error('Error checking/creating database:', error.message);
    return false;
  } finally {
    await tempPool.end();
  }
};

export default pool;
