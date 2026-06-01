const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

const users = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'operator', password: 'op123', role: 'operator' },
  { username: 'viewer', password: 'view123', role: 'viewer' },
];

for (const u of users) {
  const hash = bcrypt.hashSync(u.password, 10);
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(u.username);
  if (existing) {
    db.prepare('UPDATE users SET password_hash = ?, role = ? WHERE username = ?').run(hash, u.role, u.username);
    console.log('Updated:', u.username);
  } else {
    db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)').run(
      uuidv4(), u.username, hash, u.role
    );
    console.log('Inserted:', u.username);
  }
}

const rows = db.prepare('SELECT username, role FROM users').all();
console.log('Current users:', rows);