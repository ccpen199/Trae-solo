const { db } = require('./src/models/db');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const users = db.prepare('SELECT id, username, role FROM users').all();
    console.log('Current users:', users);
    
    const hasPlatform = users.find(u => u.username === 'platform');
    const hasOps = users.find(u => u.username === 'ops');
    
    if (!hasPlatform || !hasOps) {
      const hashedPwd = await bcrypt.hash('123456', 10);
      
      if (!hasPlatform) {
        db.prepare('INSERT INTO users (username, password_hash, phone, role) VALUES (?, ?, ?, ?)')
          .run('platform', hashedPwd, '13800000004', 'platform');
        console.log('Added platform user');
      }
      
      if (!hasOps) {
        db.prepare('INSERT INTO users (username, password_hash, phone, role) VALUES (?, ?, ?, ?)')
          .run('ops', hashedPwd, '13800000005', 'ops');
        console.log('Added ops user');
      }
    }
    
    console.log('Final users:', db.prepare('SELECT id, username, role FROM users').all());
  } catch (e) {
    console.error('Error:', e);
  }
})();
