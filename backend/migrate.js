const { db } = require('./src/models/db');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('开始重建 users 表...');
    
    const existingUsers = db.prepare('SELECT * FROM users').all();
    console.log('现有用户数量:', existingUsers.length);
    
    db.exec('ALTER TABLE users RENAME TO users_old');
    
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT UNIQUE,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'station_master', 'platform', 'ops')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    const insert = db.prepare('INSERT INTO users (id, username, password_hash, phone, role, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    for (const u of existingUsers) {
      insert.run(u.id, u.username, u.password_hash, u.phone, u.role, u.created_at);
    }
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const insertNew = db.prepare('INSERT OR IGNORE INTO users (username, password_hash, phone, role) VALUES (?, ?, ?, ?)');
    const r1 = insertNew.run('platform', hashedPassword, '13800000004', 'platform');
    console.log('platform 账号:', r1.changes > 0 ? '已添加' : '已存在');
    
    const r2 = insertNew.run('ops', hashedPassword, '13800000005', 'ops');
    console.log('ops 账号:', r2.changes > 0 ? '已添加' : '已存在');
    
    db.pragma('foreign_keys = OFF');
    db.exec('DROP TABLE IF EXISTS users_old');
    db.pragma('foreign_keys = ON');
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    
    console.log('迁移完成！');
    console.log('用户列表:', JSON.stringify(db.prepare('SELECT id, username, role FROM users').all(), null, 2));
    
  } catch (e) {
    console.error('迁移失败:', e);
    process.exit(1);
  }
})();
