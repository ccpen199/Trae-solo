import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

let dbClient = null;
let dbType = 'sqlite';

const initPostgreSQL = async () => {
  try {
    const pg = await import('pg');
    const { Pool } = pg.default || pg;
    
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'enterprise_db',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    await pool.query('SELECT 1');
    console.log('PostgreSQL 连接成功');
    dbType = 'postgresql';
    return pool;
  } catch (err) {
    console.log('PostgreSQL 连接失败，尝试使用 SQLite 降级方案:', err.message);
    return null;
  }
};

const initSQLite = async () => {
  try {
    const Database = require('better-sqlite3');
    const fs = require('fs');
    
    const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../../data/enterprise.db');
    
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const db = new Database(dbPath);
    console.log('SQLite 连接成功:', dbPath);
    dbType = 'sqlite';
    return db;
  } catch (err) {
    console.error('SQLite 初始化失败:', err.message);
    throw err;
  }
};

export const initDatabase = async () => {
  const pgPool = await initPostgreSQL();
  if (pgPool) {
    dbClient = pgPool;
    return;
  }
  
  dbClient = await initSQLite();
};

export const getDbType = () => dbType;

const convertPostgreSQLToSQLite = (sql, params) => {
  let convertedSql = sql;
  
  convertedSql = convertedSql.replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  convertedSql = convertedSql.replace(/BOOLEAN DEFAULT (true|false)/gi, (match, p1) => {
    return `INTEGER DEFAULT ${p1 === 'true' ? 1 : 0}`;
  });
  convertedSql = convertedSql.replace(/BOOLEAN/gi, 'INTEGER');
  convertedSql = convertedSql.replace(/DECIMAL\(\d+,\s*\d+\)/gi, 'REAL');
  convertedSql = convertedSql.replace(/CURRENT_TIMESTAMP/gi, "datetime('now', 'localtime')");
  convertedSql = convertedSql.replace(/\$(\d+)/g, '?');
  
  return convertedSql;
};

export const query = async (text, params = []) => {
  if (!dbClient) {
    await initDatabase();
  }

  if (dbType === 'postgresql') {
    const client = await dbClient.connect();
    try {
      const result = await client.query(text, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount
      };
    } finally {
      client.release();
    }
  } else {
    const sql = convertPostgreSQLToSQLite(text, params);
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const stmt = dbClient.prepare(sql);
      const rows = params.length > 0 ? stmt.all(...params) : stmt.all();
      return {
        rows,
        rowCount: rows.length
      };
    } else {
      const info = dbClient.prepare(sql).run(...params);
      return {
        rows: info.lastInsertRowid ? [{ id: info.lastInsertRowid }] : [],
        rowCount: info.changes
      };
    }
  }
};

export const runTransaction = async (callback) => {
  if (!dbClient) {
    await initDatabase();
  }

  if (dbType === 'postgresql') {
    const client = await dbClient.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const transaction = dbClient.transaction(callback);
    return transaction();
  }
};

export const getDbClient = () => dbClient;

export default {
  initDatabase,
  query,
  runTransaction,
  getDbType,
  getDbClient
};
