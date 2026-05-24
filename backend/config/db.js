const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(path.join(__dirname, '..', dbPath));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
