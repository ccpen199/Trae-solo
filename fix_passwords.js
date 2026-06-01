import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
const db = new Database('./data/app.sqlite');

const adminHash = bcrypt.hashSync('admin123', 10);
const userHash = bcrypt.hashSync('user123', 10);
const collabHash = bcrypt.hashSync('collab123', 10);

console.log('Updating passwords...');

db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(adminHash, 'admin');
db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(userHash, 'user');

const collabExists = db.prepare('SELECT * FROM users WHERE username = ?').get('collaborator');
if (!collabExists) {
  db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)').run('collaborator', 'collab@example.com', collabHash, 'collaborator');
  console.log('Created collaborator user');
} else {
  db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(collabHash, 'collaborator');
}

console.log('Passwords updated successfully');
console.log('Users:');
console.log(db.prepare('SELECT id, username, email, role FROM users').all());
