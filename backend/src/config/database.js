const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath, { 
  verbose: console.log,
  fileMustExist: false
});

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      resolve({ 
        lastID: result.lastInsertRowid, 
        changes: result.changes 
      });
    } catch (err) {
      reject(err);
    }
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const row = stmt.get(...params);
      resolve(row);
    } catch (err) {
      reject(err);
    }
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);
      resolve(rows);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  db,
  runAsync,
  getAsync,
  allAsync
};
