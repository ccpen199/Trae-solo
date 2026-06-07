const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'data', 'app.sqlite');
const db = new Database(dbPath);
console.log('db ok');
console.log(db.pragma('journal_mode'));
db.close();
