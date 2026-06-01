const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/app.db');
const db = new Database(dbPath);

try {
  // 1. 为异常表添加解决时间和处理人字段
  const hasResolvedAt = db.prepare("PRAGMA table_info(exceptions)").all().some(c => c.name === 'resolved_at');
  if (!hasResolvedAt) {
    db.exec('ALTER TABLE exceptions ADD COLUMN resolved_at DATETIME');
    console.log('✓ 添加 resolved_at 字段到 exceptions 表');
  }

  const hasResolvedBy = db.prepare("PRAGMA table_info(exceptions)").all().some(c => c.name === 'resolved_by');
  if (!hasResolvedBy) {
    db.exec('ALTER TABLE exceptions ADD COLUMN resolved_by TEXT');
    console.log('✓ 添加 resolved_by 字段到 exceptions 表');
  }

  const hasResolveNote = db.prepare("PRAGMA table_info(exceptions)").all().some(c => c.name === 'resolve_note');
  if (!hasResolveNote) {
    db.exec('ALTER TABLE exceptions ADD COLUMN resolve_note TEXT');
    console.log('✓ 添加 resolve_note 字段到 exceptions 表');
  }

  // 2. 创建异常处理日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS exception_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      note TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exception_id) REFERENCES exceptions(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ exception_logs 表创建成功');

  // 3. 创建通知表
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER,
      exception_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      recipient TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE,
      FOREIGN KEY (exception_id) REFERENCES exceptions(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ notifications 表创建成功');

  // 4. 为箱号表添加异常状态标记
  const hasExceptionFlag = db.prepare("PRAGMA table_info(containers)").all().some(c => c.name === 'has_exception');
  if (!hasExceptionFlag) {
    db.exec('ALTER TABLE containers ADD COLUMN has_exception INTEGER DEFAULT 0');
    console.log('✓ 添加 has_exception 字段到 containers 表');
  }

  console.log('\n数据库升级完成！');

} catch (error) {
  console.error('数据库升级失败:', error);
} finally {
  db.close();
}
