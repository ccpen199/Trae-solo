const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`ALTER TABLE products ADD COLUMN market_value REAL DEFAULT 0`);
  db.run(`UPDATE products SET market_value = points * 0.01`);
  console.log('数据库迁移完成：products表新增字段 market_value');
});

db.close();
