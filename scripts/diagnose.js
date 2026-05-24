const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const dbPath = path.join(__dirname, '../backend/data/app.sqlite');

console.log('DB Path:', dbPath);
console.log('DB 存在:', fs.existsSync(dbPath));

const db = new Database(dbPath);

console.log('\n=== 表列表 ===');
db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().forEach(t => console.log('  -', t.name));

console.log('\n=== 1. 员工账号 ===');
const staff = db.prepare('SELECT * FROM staff').all();
console.log('员工总数:', staff.length);
staff.forEach(a => console.log('  ID:', a.id, '用户名:', a.username, '角色:', a.role, '状态:', a.status, '密码hash:', a.password_hash ? '[有值]' : '[空]'));

console.log('\n=== 2. 发票数据 ===');
const invoices = db.prepare('SELECT * FROM invoices').all();
console.log('发票总数:', invoices.length);
invoices.forEach(i => console.log('  ID:', i.id, '发票号:', i.invoice_number, '状态:', i.status, '会员:', i.member_id, '交易:', i.transaction_id));

console.log('\n=== 3. 发票号重复检查 ===');
const duplicates = db.prepare(`
  SELECT invoice_number, COUNT(*) as cnt 
  FROM invoices 
  WHERE invoice_number IS NOT NULL AND invoice_number != ''
  GROUP BY invoice_number 
  HAVING cnt > 1
`).all();
console.log('重复发票号:', duplicates.length > 0 ? duplicates.map(d => `${d.invoice_number}(${d.cnt}次)`).join(', ') : '无');
