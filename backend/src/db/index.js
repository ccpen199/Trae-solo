const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbPath = process.env.DATABASE_URL || './data/app.sqlite';
const fullDbPath = path.join(__dirname, '../../', dbPath);

const dbDir = path.dirname(fullDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(fullDbPath, { verbose: null });

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
