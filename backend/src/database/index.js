const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

module.exports = {
  db,
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        const rows = stmt.all(...params);
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        const row = stmt.get(...params);
        resolve(row);
      } catch (err) {
        reject(err);
      }
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        resolve({ lastID: result.lastInsertRowid, changes: result.changes });
      } catch (err) {
        reject(err);
      }
    });
  }
};
