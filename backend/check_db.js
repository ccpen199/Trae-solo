const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);
const users = db.prepare('SELECT id, username, real_name, role, auth_source FROM users ORDER BY rowid').all();
console.log('Total users:', users.length);
users.forEach((u, i) => {
  console.log(`  [${i}] id=${u.id.substring(0,8)}  username="${u.username}"  real_name="${u.real_name}"  role=${u.role}  source=${u.auth_source}`);
});
