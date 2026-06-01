const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

try {
  db.pragma('foreign_keys = OFF');
  
  const columns = db.prepare('PRAGMA table_info(exception_handlings)').all();
  const colNames = columns.map(c => c.name);
  console.log('现有字段:', colNames);
  
  if (!colNames.includes('title')) {
    db.exec('ALTER TABLE exception_handlings ADD COLUMN title TEXT');
    console.log('添加字段: title');
  }
  if (!colNames.includes('severity')) {
    db.exec("ALTER TABLE exception_handlings ADD COLUMN severity TEXT CHECK(severity IN ('high', 'medium', 'low'))");
    console.log('添加字段: severity');
  }
  if (!colNames.includes('status')) {
    db.exec("ALTER TABLE exception_handlings ADD COLUMN status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved', 'closed'))");
    console.log('添加字段: status');
  }
  if (!colNames.includes('detected_at')) {
    db.exec('ALTER TABLE exception_handlings ADD COLUMN detected_at DATETIME');
    console.log('添加字段: detected_at');
  }
  if (!colNames.includes('handle_result')) {
    db.exec('ALTER TABLE exception_handlings ADD COLUMN handle_result TEXT');
    console.log('添加字段: handle_result');
  }
  if (!colNames.includes('handler_name')) {
    db.exec('ALTER TABLE exception_handlings ADD COLUMN handler_name TEXT');
    console.log('添加字段: handler_name');
  }
  
  db.exec("UPDATE exception_handlings SET status = 'resolved' WHERE result_type IN ('closed', 'auto_blocked')");
  db.exec("UPDATE exception_handlings SET status = 'processing' WHERE result_type = 'manual_review'");
  db.exec("UPDATE exception_handlings SET status = 'pending' WHERE status IS NULL OR status = ''");
  
  console.log('数据库更新完成!');
} catch (e) {
  console.error('更新失败:', e.message);
}
db.close();
