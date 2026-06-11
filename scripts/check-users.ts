import db from '../api/db/index.ts';

const users = db.prepare('SELECT id, username, role FROM users').all();
console.log(JSON.stringify(users, null, 2));
