const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const db = new Database(dbPath);

console.log('=== 数据库统计 ===');
console.log('用户总数:', db.prepare('SELECT COUNT(*) as c FROM users').get().c);
console.log('场馆总数:', db.prepare("SELECT COUNT(*) as c FROM venues WHERE status = 'active'").get().c);
console.log('场地总数:', db.prepare("SELECT COUNT(*) as c FROM courts WHERE status = 'active'").get().c);
console.log('球局总数:', db.prepare('SELECT COUNT(*) as c FROM games').get().c);
console.log('');
console.log('=== 球局列表 ===');
const games = db.prepare('SELECT id, title, sport_type, status, total_fee, deposit_amount, created_at FROM games').all();
console.log(games);
console.log('');
console.log('=== 成员记录 ===');
const members = db.prepare('SELECT gm.*, u.nickname FROM game_members gm JOIN users u ON gm.user_id = u.id').all();
console.log(members);
console.log('');
console.log('=== 支付记录 ===');
const payments = db.prepare('SELECT * FROM payments').all();
console.log(payments);
console.log('');
console.log('=== 时段状态统计 ===');
console.log(db.prepare("SELECT status, COUNT(*) as c FROM time_slots GROUP BY status").all());
console.log('');
console.log('=== 运营统计数据 ===');
console.log('总营收:', db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'").get().total);
console.log('已完成球局:', db.prepare("SELECT COUNT(*) as c FROM games WHERE status = 'completed'").get().c);
console.log('待处理异常:', db.prepare("SELECT COUNT(*) as c FROM exceptions WHERE status = 'pending'").get().c);

db.close();
