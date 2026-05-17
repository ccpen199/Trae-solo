const Database = require('better-sqlite3');
const path = require('path');

let db;

function getDB() {
  if (!db) {
    const dbPath = path.join(__dirname, '../../data/app.sqlite');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDB, closeDB };
