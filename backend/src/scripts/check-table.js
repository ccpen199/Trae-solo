const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

const cols = db.prepare('PRAGMA table_info(negotiations)').all();
console.log('negotiations表字段:');
cols.forEach(c => console.log(c.name, c.type, c.notnull ? 'NOT NULL' : ''));
db.close();
