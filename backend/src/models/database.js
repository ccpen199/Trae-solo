const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const backendDir = path.resolve(__dirname, '../..');
const configuredPath = process.env.DB_PATH || './data/app.sqlite';
const dbPath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.resolve(backendDir, configuredPath);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
