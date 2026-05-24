const db = require('./src/db');
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');

console.log('=== users 表 ===');
const users = db.prepare('SELECT * FROM users').all();
console.log('总数:', users.length);
users.forEach(u => console.log('  ID:', u.id, '用户名:', u.username, '角色:', u.role, '状态:', u.status, '密码hash:', u.password_hash ? '[有值]' : '[空]'));

console.log('\n=== 表结构: users ===');
db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").all().forEach(r => console.log(r.sql));

console.log('\n=== 检查 auth 路由 ===');
const authRoute = require('./src/routes/auth');
console.log('Auth 路由已加载');

console.log('\n=== 测试 admin 密码 ===');
const admin = users.find(u => u.username === 'admin');
if (admin) {
  const match = bcrypt.compareSync('admin123', admin.password_hash);
  console.log('admin 密码验证:', match ? '✅ 正确' : '❌ 错误');
} else {
  console.log('❌ admin 用户不存在');
}

console.log('\n=== 测试 API 登录 ===');
(async () => {
  try {
    const res = await fetch('http://127.0.0.1:53669/api/auth/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const data = await res.json();
    console.log('  员工登录 状态码:', res.status);
    console.log('  返回:', JSON.stringify(data));
  } catch(e) {
    console.log('  错误:', e.message);
  }
})();
