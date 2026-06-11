const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

async function testLogin() {
  console.log('=== 测试密码校验 ===');
  
  const user = await db.getAsync('SELECT * FROM users WHERE phone = ?', '13800138000');
  console.log('用户:', user ? user.real_name : '不存在');
  console.log('密码哈希:', user ? user.password_hash : 'N/A');
  
  if (user) {
    const testPasswords = ['123456', 'wrongpass', 'admin123'];
    for (const pwd of testPasswords) {
      const isValid = bcrypt.compareSync(pwd, user.password_hash);
      console.log('密码 "' + pwd + '": ' + (isValid ? '✅ 匹配' : '❌ 不匹配'));
    }
    
    const newHash = bcrypt.hashSync('123456', 10);
    console.log('新生成的 123456 哈希:', newHash.substring(0, 40) + '...');
    const newIsValid = bcrypt.compareSync('123456', newHash);
    console.log('新哈希校验 123456:', newIsValid ? '✅ 匹配' : '❌ 不匹配');
  }
  
  process.exit(0);
}

testLogin().catch(e => {
  console.error('错误:', e);
  process.exit(1);
});
