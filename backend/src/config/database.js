require('dotenv').config();

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const db = new Database(path.resolve(__dirname, '../../', dbPath));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
