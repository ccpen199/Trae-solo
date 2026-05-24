const path = require('path');
const dbPath = path.join(__dirname, '../backend/data/app.sqlite');
const Database = require('better-sqlite3');
const db = new Database(dbPath);

console.log('=== 1. 员工表所有账号 ===');
const staff = db.prepare("SELECT * FROM staff").all();
console.log('  员工总数:', staff.length);
staff.forEach(a => console.log('  ID:', a.id, '用户名:', a.username, '角色:', a.role, '状态:', a.status, '密码hash长度:', a.password_hash?.length || 0));

console.log('\n=== 2. 数据库路径 ===');
console.log('  DB Path:', dbPath);
console.log('  表列表:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name));
