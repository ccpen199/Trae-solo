const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`ALTER TABLE accounts ADD COLUMN verify_code TEXT DEFAULT 'VERIFY_SUCCESS'`);
  db.run(`ALTER TABLE accounts ADD COLUMN verify_status TEXT DEFAULT 'verified'`);
  console.log('数据库迁移完成：accounts表新增字段 verify_code, verify_status');
});

db.close();
