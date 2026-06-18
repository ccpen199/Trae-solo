const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const db = new Database(dbPath);

try {
  db.exec('ALTER TABLE training_progress ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP');
  console.log('✓ ALTER TABLE training_progress ADD COLUMN updated_at 成功');
} catch(e) {
  console.log('列可能已存在或失败:', e.message);
}

console.log('\n表结构:');
const columns = db.pragma('table_info(training_progress)');
console.table(columns);

console.log('\n数据:');
const rows = db.prepare('SELECT * FROM training_progress LIMIT 3').all();
console.table(rows);
