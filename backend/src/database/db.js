const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/library.db');
const dataDir = path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

class DatabaseWrapper {
  constructor() {
    this.db = db;
  }

  run(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(params);
    return {
      lastInsertRowid: info.lastInsertRowid,
      changes: info.changes
    };
  }

  get(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.get(params);
  }

  all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.all(params);
  }

  close() {
    this.db.close();
  }
}

module.exports = new DatabaseWrapper();
