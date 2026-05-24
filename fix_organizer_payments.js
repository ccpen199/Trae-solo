const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const db = new Database(dbPath);

console.log('=== 补录组织者支付记录 ===');

const organizers = db.prepare(`
  SELECT gm.*, g.deposit_amount 
  FROM game_members gm 
  JOIN games g ON gm.game_id = g.id 
  WHERE gm.role = 'organizer' AND gm.deposit_paid = 0 AND g.deposit_amount > 0
`).all();

console.log('需要补录的组织者:', organizers.length);

for (const m of organizers) {
  db.prepare('UPDATE game_members SET deposit_paid = ? WHERE id = ?').run(m.deposit_amount, m.id);
  db.prepare(`
    INSERT INTO payments (game_id, user_id, amount, payment_type, status)
    VALUES (?, ?, ?, 'deposit', 'completed')
  `).run(m.game_id, m.user_id, m.deposit_amount);
  console.log(`补录组织者: 球局${m.game_id} - 用户${m.user_id} - ¥${m.deposit_amount}`);
}

console.log('');
console.log('=== 最终统计 ===');
console.log('支付记录总数:', db.prepare('SELECT COUNT(*) as c FROM payments').get().c);
console.log('总营收:', db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'").get().total);
console.log('订金收入:', db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND payment_type = 'deposit'").get().total);

db.close();
