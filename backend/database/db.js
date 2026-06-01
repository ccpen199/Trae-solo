const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'training.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('Database initialized successfully');
}

function getDb() {
  return db;
}

function run(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

function prepare(sql) {
  return db.prepare(sql);
}

function transaction(fn) {
  return db.transaction(fn);
}

module.exports = {
  initDatabase,
  getDb,
  run,
  get,
  all,
  prepare,
  transaction
};
