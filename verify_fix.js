const Database = require('better-sqlite3');
const db = new Database('./data/app.sqlite');

console.log('=== 所有支付记录 ===');
const payments = db.prepare(`
  SELECT p.*, u.nickname, g.title 
  FROM payments p 
  JOIN users u ON p.user_id = u.id 
  JOIN games g ON p.game_id = g.id 
  ORDER BY p.id
`).all();

payments.forEach(p => {
  console.log(`#${p.id} | ${p.title} | ${p.nickname} | ¥${p.amount} | ${p.payment_type} | ${p.created_at}`);
});

console.log('');
console.log('=== 运营统计 ===');
const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM payments WHERE status='completed'").get().t;
const depositRevenue = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM payments WHERE status='completed' AND payment_type='deposit'").get().t;
console.log('总营收:', totalRevenue);
console.log('订金收入:', depositRevenue);
console.log('支付记录数:', db.prepare('SELECT COUNT(*) as c FROM payments').get().c);
console.log('球局数:', db.prepare('SELECT COUNT(*) as c FROM games').get().c);
console.log('进行中球局:', db.prepare("SELECT COUNT(*) as c FROM games WHERE status IN ('recruiting','confirmed')").get().c);

db.close();
