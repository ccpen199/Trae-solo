const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

try {
  db.pragma('foreign_keys = OFF');
  
  const columns = db.prepare('PRAGMA table_info(exception_handlings)').all();
  const colNames = columns.map(c => c.name);
  
  if (!colNames.includes('is_auto_blocked')) {
    db.exec('ALTER TABLE exception_handlings ADD COLUMN is_auto_blocked INTEGER DEFAULT 0');
    console.log('添加字段: is_auto_blocked');
  }
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS exception_handlings_new (
      id TEXT PRIMARY KEY,
      negotiation_id TEXT NOT NULL,
      exception_type TEXT NOT NULL,
      title TEXT,
      description TEXT,
      severity TEXT CHECK(severity IN ('high', 'medium', 'low')),
      status TEXT CHECK(status IN ('pending', 'processing', 'resolved', 'closed', 'auto_blocked', 'manual_review')),
      result_type TEXT,
      handle_result TEXT,
      handler_id TEXT,
      handler_name TEXT,
      handled_at DATETIME,
      detected_at DATETIME,
      is_auto_blocked INTEGER DEFAULT 0,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.exec(`
    INSERT OR REPLACE INTO exception_handlings_new 
    (id, negotiation_id, exception_type, title, description, severity, status, result_type, handle_result, handler_id, handler_name, handled_at, detected_at, is_auto_blocked, remarks, created_at, updated_at)
    SELECT id, negotiation_id, exception_type, title, description, severity, 
           CASE 
             WHEN status = 'pending' AND severity = 'high' THEN 'auto_blocked'
             ELSE status 
           END as status,
           result_type, handle_result, handler_id, handler_name, handled_at, detected_at, 
           CASE WHEN severity = 'high' THEN 1 ELSE 0 END as is_auto_blocked,
           remarks, created_at, updated_at
    FROM exception_handlings
  `);
  
  db.exec('DROP TABLE exception_handlings');
  db.exec('ALTER TABLE exception_handlings_new RENAME TO exception_handlings');
  
  console.log('表结构更新完成!');
  
  const cols = db.prepare('PRAGMA table_info(exception_handlings)').all();
  console.log('当前字段:', cols.map(c => c.name));
} catch (e) {
  console.error('失败:', e.message);
}
db.close();
