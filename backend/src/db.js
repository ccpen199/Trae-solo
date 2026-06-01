const Database = require('better-sqlite3');
const path = require('path');

let db = null;

function getDb() {
  if (!db) {
    const dbPath = path.join(__dirname, '../data/app.sqlite');
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
  }
  return db;
}

module.exports = { getDb };
