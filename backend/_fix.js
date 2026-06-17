const Database = require('better-sqlite3');
const path = require('path');
const dayjs = require('dayjs');
const dataDir = path.join(__dirname, 'src', 'data');
const dbPath = path.join(dataDir, 'app.sqlite');
console.log('dbPath:', dbPath);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

console.log('--- 表结构 (created_at 字段) ---');
const cols = db.prepare("PRAGMA table_info(orders)").all();
cols.filter(c => c.name.includes('created') || c.name.includes('updated')).forEach(c => console.log(c.cid, c.name, c.type, 'default=' + c.dflt_value));

console.log('\n--- 当前 created_at ---');
const rows = db.prepare('SELECT id, order_no, created_at, updated_at FROM orders').all();
rows.forEach(r => console.log(JSON.stringify(r)));

console.log('\n--- 手动 UPDATE ---');
const now = dayjs();
let totalChanges = 0;
rows.forEach(r => {
  if (!r.created_at) {
    const t = now.subtract(5 + r.id * 12, 'minute').format('YYYY-MM-DD HH:mm:ss');
    const info = db.prepare('UPDATE orders SET created_at = ? WHERE id = ?').run(t, r.id);
    totalChanges += info.changes;
    console.log('  id=' + r.id + ' => ' + t + ' (changes=' + info.changes + ')');
  }
});
db.pragma('wal_checkpoint(TRUNCATE)');

console.log('\n--- UPDATE 后验证 (同连接) ---');
db.prepare('SELECT id, order_no, created_at FROM orders').all().forEach(r => console.log(JSON.stringify(r)));

db.close();
console.log('\nDone. totalChanges=' + totalChanges);
