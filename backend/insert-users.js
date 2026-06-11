const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

async function insertTestUsers() {
  const passwordHash = bcrypt.hashSync('123456', 10);
  
  const users = [
    { id_card: '110101199001011235', name: '系统管理员', phone: 'admin', province: '北京市', city: '北京市', auth_level: 2 },
    { id_card: '110101199001011236', name: '平台运营', phone: 'platform', province: '北京市', city: '北京市', auth_level: 2 },
    { id_card: '110101199001011237', name: '运维工程师', phone: 'ops', province: '北京市', city: '北京市', auth_level: 2 },
  ];
  
  for (const u of users) {
    const exists = await db.getAsync('SELECT id FROM users WHERE phone = ?', u.phone);
    if (!exists) {
      await db.runAsync(
        'INSERT INTO users (id_card_no, real_name, phone, province, city, password_hash, auth_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
        u.id_card, u.name, u.phone, u.province, u.city, passwordHash, u.auth_level
      );
      console.log('已插入用户:', u.phone);
    } else {
      console.log('用户已存在:', u.phone);
    }
  }
  
  const result = await db.allAsync('SELECT id, phone, real_name, auth_level FROM users ORDER BY id');
  console.log('\n=== 用户列表 ===');
  for (const u of result) {
    console.log('ID:', u.id, 'Phone:', u.phone, 'Name:', u.real_name, 'Auth:', u.auth_level);
  }
  
  process.exit(0);
}

insertTestUsers().catch(e => { console.error('错误:', e); process.exit(1); });
