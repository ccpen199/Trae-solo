const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath, {
  verbose: console.log,
  fileMustExist: false
});

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const run = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
};

const get = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

const all = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

const exec = (sql) => {
  return db.exec(sql);
};

module.exports = {
  db,
  run,
  get,
  all,
  exec
};
