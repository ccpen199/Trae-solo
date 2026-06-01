const Database = require('better-sqlite3');
const path = require('path');

let db = null;

const getDb = () => {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(__dirname, 'land_transfer.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
};

const closeDb = () => {
  if (db) {
    db.close();
    db = null;
  }
};

module.exports = { getDb, closeDb };
