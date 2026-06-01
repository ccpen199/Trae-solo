const db = require('./src/models/database');

console.log('Tables:');
console.log(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());

console.log('\nUsers:');
console.log(db.prepare('SELECT * FROM users').all());

console.log('\nRoles:');
console.log(db.prepare('SELECT * FROM roles').all());
