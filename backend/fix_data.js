const Database = require('better-sqlite3');
const db = new Database('../data/app.sqlite');

console.log('=== 修复滞留件数据 ===');
const result = db.prepare("UPDATE packages SET is_overdue = 1 WHERE status = 'overdue'").run();
console.log('更新了', result.changes, '行滞留件标记');

console.log('\n=== 验证统计结果 ===');
const stats = db.prepare("SELECT status, is_overdue, COUNT(*) as count FROM packages GROUP BY status, is_overdue").all();
console.log(stats);

console.log('\n=== 快递员1的滞留件统计 ===');
const courierOverdue = db.prepare("SELECT COUNT(*) as count FROM packages WHERE status = 'overdue' AND courier_id = 1").get();
console.log('滞留件数量:', courierOverdue.count);

console.log('\n=== 检查包裹表字段 ===');
const columns = db.prepare("PRAGMA table_info(packages)").all();
console.log(columns.map(c => c.name));

db.close();
