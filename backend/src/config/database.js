const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    db.configure('busyTimeout', 8000);
    db.serialize();
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA busy_timeout = 8000');
    db.run('PRAGMA foreign_keys = ON');
  }
});

db.runAsync = function(sql, ...params) {
  return new Promise((resolve, reject) => {
    const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    this.run(sql, args, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

db.getAsync = function(sql, ...params) {
  return new Promise((resolve, reject) => {
    const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    this.get(sql, args, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = function(sql, ...params) {
  return new Promise((resolve, reject) => {
    const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    this.all(sql, args, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

db.execAsync = function(sql) {
  return new Promise((resolve, reject) => {
    this.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

db.closeAsync = function() {
  return new Promise((resolve, reject) => {
    this.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

module.exports = db;
