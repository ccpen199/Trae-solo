const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend/data/app.sqlite');
const db = new Database(dbPath);

const checkUser = db.prepare('SELECT id FROM users WHERE username = ?');

if (!checkUser.get('platform')) {
  const password = bcrypt.hashSync('platform123', 10);
  db.prepare('INSERT INTO users (username, password, role, real_name, phone, id_card, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run('platform', password, 'admin', '平台运营', '13600136001', '110101199001010004', 'active');
  console.log('Added platform user');
} else {
  console.log('platform user already exists');
}

if (!checkUser.get('ops')) {
  const password = bcrypt.hashSync('ops123', 10);
  db.prepare('INSERT INTO users (username, password, role, real_name, phone, id_card, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run('ops', password, 'admin', '系统运维', '13500135001', '110101199001010005', 'active');
  console.log('Added ops user');
} else {
  console.log('ops user already exists');
}

console.log('\nCurrent users:');
const users = db.prepare('SELECT id, username, role, status, real_name FROM users').all();
console.table(users);

db.close();
