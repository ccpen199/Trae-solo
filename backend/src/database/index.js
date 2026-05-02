const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const info = db.prepare(sql).run(params);
      resolve({ lastID: info.lastInsertRowid, changes: info.changes });
    } catch (err) {
      reject(err);
    }
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.prepare(sql).get(params);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const results = db.prepare(sql).all(params);
      resolve(results);
    } catch (err) {
      reject(err);
    }
  });
};

const exec = (sql) => {
  return new Promise((resolve, reject) => {
    try {
      db.exec(sql);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const transaction = (fn) => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.transaction(fn)();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  db,
  run,
  get,
  all,
  exec,
  transaction
};
