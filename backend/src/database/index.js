const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const fullDbPath = path.resolve(__dirname, '..', '..', dbPath);

let db = null;

const getDatabase = () => {
  if (!db) {
    const dataDir = path.dirname(fullDbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    db = new Database(fullDbPath);
    
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
    
    logger.info(`数据库连接已建立: ${fullDbPath}`);
  }
  return db;
};

const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
    logger.info('数据库连接已关闭');
  }
};

const transaction = (fn) => {
  const database = getDatabase();
  return database.transaction(fn);
};

const run = (sql, params = []) => {
  const database = getDatabase();
  try {
    const stmt = database.prepare(sql);
    const result = stmt.run(...params);
    return {
      success: true,
      lastInsertRowid: result.lastInsertRowid,
      changes: result.changes
    };
  } catch (error) {
    logger.error(`SQL执行错误: ${sql}`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

const get = (sql, params = []) => {
  const database = getDatabase();
  try {
    const stmt = database.prepare(sql);
    const result = stmt.get(...params);
    return result || null;
  } catch (error) {
    logger.error(`SQL查询错误: ${sql}`, error);
    return null;
  }
};

const all = (sql, params = []) => {
  const database = getDatabase();
  try {
    const stmt = database.prepare(sql);
    const results = stmt.all(...params);
    return results;
  } catch (error) {
    logger.error(`SQL查询错误: ${sql}`, error);
    return [];
  }
};

const exec = (sql) => {
  const database = getDatabase();
  try {
    database.exec(sql);
    return { success: true };
  } catch (error) {
    logger.error(`SQL执行错误: ${sql}`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getDatabase,
  closeDatabase,
  transaction,
  run,
  get,
  all,
  exec
};
