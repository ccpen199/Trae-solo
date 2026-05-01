import { createPool, Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { config } from './config';

let pool: Pool | null = null;

export async function getDatabasePool(): Promise<Pool> {
  if (!pool) {
    pool = createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: any[]
): Promise<T> {
  const pool = await getDatabasePool();
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

export async function execute(
  sql: string,
  params?: any[]
): Promise<ResultSetHeader> {
  const pool = await getDatabasePool();
  const [result] = await pool.execute(sql, params);
  return result as ResultSetHeader;
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
