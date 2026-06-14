
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
