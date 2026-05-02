const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

console.log('SQLite 数据库连接成功:', dbPath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

const run = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(params);
    return Promise.resolve({ lastID: result.lastInsertRowid, changes: result.changes });
  } catch (err) {
    return Promise.reject(err);
  }
};

const get = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.get(params);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
};

const all = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.all(params);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
};

const exec = (sql) => {
  try {
    db.exec(sql);
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  }
};

const transaction = async (callback) => {
  try {
    db.exec('BEGIN TRANSACTION');
    const result = await callback();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
};

module.exports = {
  db,
  run,
  get,
  all,
  exec,
  transaction
};
