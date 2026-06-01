const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

try {
  db.pragma('foreign_keys = OFF');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS exception_handlings_new (
      id TEXT PRIMARY KEY,
      negotiation_id TEXT NOT NULL,
      exception_type TEXT NOT NULL,
      title TEXT,
      description TEXT,
      severity TEXT CHECK(severity IN ('high', 'medium', 'low')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved', 'closed')),
      result_type TEXT,
      handle_result TEXT,
      handler_id TEXT,
      handler_name TEXT,
      handled_at DATETIME,
      detected_at DATETIME,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.exec(`
    INSERT INTO exception_handlings_new 
    (id, negotiation_id, exception_type, description, result_type, handler_id, handled_at, remarks, created_at, updated_at)
    SELECT id, negotiation_id, exception_type, description, result_type, handler_id, handled_at, remarks, created_at, updated_at
    FROM exception_handlings
  `);
  
  db.exec('DROP TABLE exception_handlings');
  db.exec('ALTER TABLE exception_handlings_new RENAME TO exception_handlings');
  
  console.log('表结构重构完成!');
  
  const cols = db.prepare('PRAGMA table_info(exception_handlings)').all();
  console.log('新字段列表:');
  cols.forEach(c => console.log(c.name, c.type, c.notnull ? 'NOT NULL' : ''));
} catch (e) {
  console.error('失败:', e.message);
}
db.close();
