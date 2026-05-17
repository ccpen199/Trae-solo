const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');

let db;

try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (error) {
  console.error('数据库连接失败:', error);
  process.exit(1);
}

module.exports = db;
