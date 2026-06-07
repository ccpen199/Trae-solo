import db from './api/db.ts';

const users = [
  { id: 1, username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin' },
  { id: 2, username: 'huawei_user', password: 'huawei123', name: '华为管理员', role: 'enterprise' },
  { id: 3, username: 'byd_user', password: 'byd123', name: '比亚迪管理员', role: 'enterprise' },
  { id: 4, username: 'midea_user', password: 'midea123', name: '美的管理员', role: 'enterprise' },
  { id: 5, username: 'tencent_user', password: 'tencent123', name: '腾讯管理员', role: 'enterprise' },
];

for (const user of users) {
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(user.id);
  if (existing) {
    db.prepare('UPDATE users SET password_hash = ?, name = ?, role = ? WHERE id = ?')
      .run(user.password, user.name, user.role, user.id);
    console.log('Updated user:', user.username);
  }
}

const platformUser = db.prepare('SELECT id FROM users WHERE username = ?').get('platform');
if (!platformUser) {
  db.prepare('INSERT INTO users (username, password_hash, name, role, enterprise_id) VALUES (?, ?, ?, ?, NULL)')
    .run('platform', 'platform123', '平台运营专员', 'platform');
  console.log('Created user: platform');
} else {
  db.prepare('UPDATE users SET password_hash = ?, name = ?, role = ? WHERE username = ?')
    .run('platform123', '平台运营专员', 'platform', 'platform');
  console.log('Updated user: platform');
}

const opsUser = db.prepare('SELECT id FROM users WHERE username = ?').get('ops');
if (!opsUser) {
  db.prepare('INSERT INTO users (username, password_hash, name, role, enterprise_id) VALUES (?, ?, ?, ?, NULL)')
    .run('ops', 'ops123', '政务运维专员', 'ops');
  console.log('Created user: ops');
} else {
  db.prepare('UPDATE users SET password_hash = ?, name = ?, role = ? WHERE username = ?')
    .run('ops123', '政务运维专员', 'ops', 'ops');
  console.log('Updated user: ops');
}

const allUsers = db.prepare('SELECT id, username, name, role, enterprise_id, password_hash FROM users').all();
console.log('\n=== Final Users ===');
console.log(JSON.stringify(allUsers, null, 2));
