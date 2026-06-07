import { getDb, initDb } from './api/db.js';

console.log('=== 数据库结构检查 ===');
initDb();
const db = getDb();

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
console.log('现有表:', tables.map(t => t.name));

console.log('\n=== 检查 agent_contact_records 表 ===');
const contactCols = db.prepare("PRAGMA table_info(agent_contact_records)").all() as any[];
console.log('字段:', contactCols.map(c => `${c.name}(${c.type})`));

console.log('\n=== 检查 exclusive_assignments 表 ===');
const exclCols = db.prepare("PRAGMA table_info(exclusive_assignments)").all() as any[];
console.log('字段:', exclCols.map(c => `${c.name}(${c.type})`));

if (!exclCols || exclCols.length === 0) {
  console.log('\n=== 创建 exclusive_assignments 表 ===');
  db.exec(`
    CREATE TABLE IF NOT EXISTS exclusive_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      assigned_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('表创建成功');
}

console.log('\n=== 检查 has_shared 字段 ===');
const hasHasShared = contactCols.some(c => c.name === 'has_shared');
if (!hasHasShared) {
  console.log('添加 has_shared 字段...');
  db.exec('ALTER TABLE agent_contact_records ADD COLUMN has_shared INTEGER DEFAULT 1');
  console.log('字段添加成功');
}

console.log('\n=== 初始化完成 ===');
