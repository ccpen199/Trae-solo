const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;
try {
  db = new Database(dbPath);
  console.log('已连接到 SQLite 数据库:', dbPath);
  db.pragma('foreign_keys = ON');
} catch (err) {
  console.error('数据库连接失败:', err.message);
  throw err;
}

const run = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return { lastID: result.lastInsertRowid, changes: result.changes };
  } catch (err) {
    console.error('SQL执行错误:', sql, err.message);
    throw err;
  }
};

const get = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  } catch (err) {
    console.error('SQL查询错误:', sql, err.message);
    throw err;
  }
};

const all = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (err) {
    console.error('SQL查询错误:', sql, err.message);
    throw err;
  }
};

const exec = (sql) => {
  try {
    db.exec(sql);
    return { success: true };
  } catch (err) {
    console.error('SQL执行错误:', err.message);
    throw err;
  }
};

const transaction = (fn) => {
  return db.transaction(fn);
};

module.exports = {
  db,
  run,
  get,
  all,
  exec,
  transaction
};
