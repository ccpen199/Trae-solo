const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');

const db = new Database(dbPath, {
  verbose: null,
  timeout: 5000
});

db.pragma('foreign_keys = ON');

function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error('数据库查询错误:', error.message);
    throw error;
  }
}

function queryOne(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  } catch (error) {
    console.error('数据库查询错误:', error.message);
    throw error;
  }
}

function run(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return {
      lastID: result.lastInsertRowid,
      changes: result.changes
    };
  } catch (error) {
    console.error('数据库执行错误:', error.message);
    throw error;
  }
}

function transaction(callback) {
  const tx = db.transaction(callback);
  return tx();
}

module.exports = {
  db,
  query,
  queryOne,
  run,
  transaction
};
