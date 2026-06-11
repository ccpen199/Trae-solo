import db from '../api/db/index.ts';

db.prepare("UPDATE users SET username = 'ops' WHERE id = 'operator001'").run();

const users = db.prepare('SELECT id, username, role FROM users').all();
console.log(JSON.stringify(users, null, 2));
