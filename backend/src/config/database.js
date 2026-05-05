require('dotenv').config();
const { Pool } = require('pg');
const memoryDB = require('./memoryDB');

let useMemoryDB = process.env.USE_MEMORY_DB === 'true';
let pool = null;

const initPool = async () => {
  if (useMemoryDB) return;
  
  try {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'train_ticket',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL 连接成功');
  } catch (error) {
    console.log('⚠️ PostgreSQL 连接失败，切换到内存数据库模式:', error.message);
    useMemoryDB = true;
    pool = null;
  }
};

const query = async (text, params = []) => {
  if (useMemoryDB) {
    return memoryDB.query(text, params);
  }
  
  if (!pool) {
    await initPool();
  }
  
  if (useMemoryDB) {
    return memoryDB.query(text, params);
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

const transaction = async (callback) => {
  if (useMemoryDB) {
    return memoryDB.transaction(callback);
  }
  
  if (!pool) {
    await initPool();
  }
  
  if (useMemoryDB) {
    return memoryDB.transaction(callback);
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const isMemoryMode = () => useMemoryDB;

module.exports = {
  pool,
  query,
  transaction,
  isMemoryMode,
  initPool,
};
