const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath, { verbose: null });

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
