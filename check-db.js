const Database = require('better-sqlite3');
const db = new Database('/Users/chen/Documents/trae_projects/local_projects/may-89092/data/app.sqlite');

console.log('=== Database tables ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

console.log('\n=== Table row counts ===');
const tableList = ['users', 'clients', 'trademarks', 'patents', 'copyrights', 'cases', 'contracts', 'notifications', 'case_timeline'];
tableList.forEach(t => {
  try {
    const count = db.prepare('SELECT COUNT(*) as c FROM ' + t).get().c;
    console.log(t + ': ' + count + ' rows');
  } catch(e) {
    console.log(t + ': ERROR - ' + e.message);
  }
});

console.log('\n=== Sample users ===');
const users = db.prepare('SELECT id, username, role, name FROM users').all();
users.forEach(u => console.log(`  ${u.username} (${u.role}): ${u.name}`));

db.close();
