const Database = require('better-sqlite3');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const db = new Database(dbPath, { verbose: console.log });

const all = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

const get = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

const run = (sql, params = []) => {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return { lastID: result.lastInsertRowid, changes: result.changes };
};

module.exports = { db, all, get, run };
