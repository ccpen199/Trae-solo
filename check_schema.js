const Database = require('better-sqlite3');
const path = require('path');
const PROJECT_DIR = path.resolve(__dirname, '.');
const DB_PATH = path.resolve(PROJECT_DIR, './data/app.sqlite');
console.log('DB_PATH:', DB_PATH);

const db = new Database(DB_PATH);

console.log('\n=== workers表字段 ===');
const columns = db.prepare('PRAGMA table_info(workers)').all();
columns.forEach(c => console.log(c.cid, c.name, c.type));

console.log('\n=== job_requirements表字段 ===');
const jobColumns = db.prepare('PRAGMA table_info(job_requirements)').all();
jobColumns.forEach(c => console.log(c.cid, c.name, c.type));

console.log('\n=== workers数据样例 ===');
const worker = db.prepare('SELECT * FROM workers LIMIT 1').get();
console.log('字段:', Object.keys(worker));
console.log('数据:', worker);
