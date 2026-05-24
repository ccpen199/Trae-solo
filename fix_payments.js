const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const db = new Database(dbPath);

console.log('=== 补回历史支付记录 ===');

const members = db.prepare(`
  SELECT gm.*, g.deposit_amount 
  FROM game_members gm 
  JOIN games g ON gm.game_id = g.id
  WHERE gm.deposit_paid > 0
`).all();

console.log(`找到 ${members.length} 条需要补录支付的成员记录`);

let count = 0;
for (const m of members) {
  const existing = db.prepare(`
    SELECT * FROM payments 
    WHERE game_id = ? AND user_id = ? AND payment_type = 'deposit'
  `).get(m.game_id, m.user_id);
  
  if (!existing) {
    db.prepare(`
      INSERT INTO payments (game_id, user_id, amount, payment_type, status)
      VALUES (?, ?, ?, 'deposit', 'completed')
    `).run(m.game_id, m.user_id, m.deposit_paid);
    count++;
    console.log(`补录: 球局${m.game_id} - 用户${m.user_id} - ¥${m.deposit_paid}`);
  }
}

console.log(`\n完成！共补录 ${count} 条支付记录`);
console.log('当前支付记录总数:', db.prepare('SELECT COUNT(*) as c FROM payments').get().c);
console.log('总营收:', db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'").get().total);

db.close();
