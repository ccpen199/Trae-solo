const db = require('../backend/src/db');

console.log('=== 1. 员工账号 ===');
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

console.log('\n=== 4. 测试员工登录 ===');
const bcrypt = require('bcryptjs');
const admin = staff.find(s => s.username === 'admin');
if (admin) {
  const match = bcrypt.compareSync('admin123', admin.password_hash);
  console.log('admin 密码验证:', match ? '✅ 正确' : '❌ 错误');
}

console.log('\n=== 5. 测试API登录 ===');
const fetch = require('node-fetch');
(async () => {
  try {
    const res = await fetch('http://127.0.0.1:53669/api/auth/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const data = await res.json();
    console.log('  状态码:', res.status);
    console.log('  返回:', JSON.stringify(data));
  } catch(e) {
    console.log('  错误:', e.message);
  }
})();
