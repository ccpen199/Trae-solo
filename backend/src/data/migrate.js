const { db } = require('../models/db');

function migrateUsersTable() {
  const tableInfo = db.pragma("table_info('users')");
  const roleConstraint = tableInfo.find(col => col.name === 'role');
  
  if (roleConstraint) {
    console.log('检查 users 表角色约束...');
    const existingRoles = ['user', 'admin', 'station_master', 'platform', 'ops'];
    
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          phone TEXT UNIQUE,
          role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'station_master', 'platform', 'ops')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        INSERT OR IGNORE INTO users_new SELECT * FROM users;
        
        DROP TABLE IF EXISTS users;
        
        ALTER TABLE users_new RENAME TO users;
        
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      `);
      console.log('users 表迁移完成，已添加 platform 和 ops 角色支持');
    } catch (err) {
      console.log('users 表迁移跳过或已完成:', err.message);
    }
  }
}

module.exports = { migrateUsersTable };
