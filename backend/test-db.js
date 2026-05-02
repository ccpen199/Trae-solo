const db = require('./src/database/init');
const bcrypt = require('bcryptjs');

console.log('=== 测试数据库 ===');

console.log('1. 测试同步风格:');
const userSync = db.get('SELECT * FROM users WHERE username = ?', ['lawyer1']);
console.log('同步查询结果:', userSync ? { id: userSync.id, username: userSync.username, name: userSync.name } : null);

console.log('\n2. 测试异步回调风格:');
db.get('SELECT * FROM users WHERE username = ?', ['lawyer1'], (err, user) => {
  if (err) {
    console.log('回调查询错误:', err);
  } else {
    console.log('回调查询结果:', user ? { id: user.id, username: user.username, name: user.name } : null);
  }
});

console.log('\n3. 测试 bcrypt 密码验证:');
const hash = userSync ? userSync.password : '';
console.log('存储的哈希:', hash.substring(0, 30) + '...');
const testPassword = '123456';
const isMatch = bcrypt.compareSync(testPassword, hash);
console.log('同步验证结果 (123456):', isMatch);

console.log('\n=== 测试完成 ===');
