import db from '../api/db/index.ts';

db.prepare("UPDATE users SET username = 'owner' WHERE id = 'owner001'").run();
db.prepare("UPDATE users SET username = 'fleet' WHERE id = 'fleet001'").run();
db.prepare("UPDATE users SET username = 'driver' WHERE id = 'driver001'").run();
db.prepare("UPDATE users SET username = 'ops' WHERE id = 'operator001'").run();

const users = db.prepare('SELECT id, username, role FROM users').all();
console.log(JSON.stringify(users, null, 2));
