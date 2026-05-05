require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'shop.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

class DatabaseWrapper {
  constructor(db) {
    this.db = db;
  }

  query(sql, params = []) {
    try {
      const sqlLower = sql.trim().toLowerCase();
      
      if (sqlLower.startsWith('select')) {
        const stmt = this.db.prepare(sql);
        let result;
        if (params.length === 0) {
          result = stmt.all();
        } else {
          result = stmt.all(...params);
        }
        return { rows: result };
      } else {
        const stmt = this.db.prepare(sql);
        let info;
        if (params.length === 0) {
          info = stmt.run();
        } else {
          info = stmt.run(...params);
        }
        return {
          rows: [],
          lastInsertRowid: info.lastInsertRowid,
          changes: info.changes
        };
      }
    } catch (error) {
      console.error('SQL Error:', sql, params, error);
      throw error;
    }
  }
}

const dbWrapper = new DatabaseWrapper(db);
module.exports = dbWrapper;
module.exports.db = db;
