const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const fullDbPath = path.resolve(__dirname, '../../', dbPath);

const db = new Database(fullDbPath, { 
  verbose: console.log,
  fileMustExist: false
});

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('数据库连接成功:', fullDbPath);

module.exports = db;
