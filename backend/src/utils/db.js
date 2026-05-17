const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath, { verbose: console.log });

const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const result = Array.isArray(params) ? stmt.run(...params) : stmt.run(params);
      resolve({ lastID: result.lastInsertRowid, changes: result.changes });
    } catch (err) {
      reject(err);
    }
  });
};

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const row = Array.isArray(params) ? stmt.get(...params) : stmt.get(params);
      resolve(row);
    } catch (err) {
      reject(err);
    }
  });
};

const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const rows = Array.isArray(params) ? stmt.all(...params) : stmt.all(params);
      resolve(rows);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  db,
  runAsync,
  getAsync,
  allAsync
};
