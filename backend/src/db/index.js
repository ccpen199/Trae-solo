const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.db');
const db = new Database(dbPath, { verbose: console.log });

db.pragma('journal_mode = WAL');

const run = (sql, params = []) => {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return { lastID: result.lastInsertRowid, changes: result.changes };
};

const get = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

const all = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

module.exports = { db, run, get, all };
