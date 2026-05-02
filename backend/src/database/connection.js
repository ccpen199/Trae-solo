const { initDatabase } = require('./init');
const path = require('path');

let db = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/app.sqlite');
    db = initDatabase(dbPath);
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
    console.log('数据库连接已关闭');
  }
}

module.exports = { getDb, closeDb };
