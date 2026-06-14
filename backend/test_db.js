const db = require('./database');

console.log('Database initialized successfully');

const users = db.query('SELECT COUNT(*) as count FROM users');
console.log('Users:', users[0].count);

const roles = db.query('SELECT COUNT(*) as count FROM roles');
console.log('Roles:', roles[0].count);

const perms = db.query('SELECT COUNT(*) as count FROM permissions');
console.log('Permissions:', perms[0].count);

const tables = db.query("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT IN ('notes', 'tasks')");
console.log('Total tables:', tables[0].count);

const jobs = db.query('SELECT COUNT(*) as count FROM jobs');
console.log('Jobs:', jobs[0].count);

const policies = db.query('SELECT COUNT(*) as count FROM policies');
console.log('Policies:', policies[0].count);

const exams = db.query('SELECT COUNT(*) as count FROM exams');
console.log('Exams:', exams[0].count);

const testUser = db.query('SELECT id, username, real_name, user_type FROM users WHERE username = ?', ['zhangsan']);
console.log('Test user:', testUser[0]);

console.log('\nAll tests passed!');
