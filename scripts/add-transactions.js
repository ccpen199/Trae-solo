const db = require('../backend/src/db');

console.log('=== 给会员1添加3条可开发票的交易记录 ===');
const tx = db.transaction(() => {
  for (let i = 0; i < 3; i++) {
    const date = `2026-05-1${8+i} 10:30:00`;
    db.prepare(`
      INSERT INTO transactions 
      (station_id, nozzle_id, member_id, vehicle_id, fuel_type_id, volume, unit_price, 
       original_amount, discount_amount, coupon_amount, points_used, points_discount, 
       final_amount, payment_method, points_earned, status, invoice_status, end_time)
      VALUES (1, 1, 1, 1, 1, 45.5, 8.31, 378.11, 0, 0, 0, 0, 378.11, 'wechat', 38, 'completed', 'not_issued', ?)
    `).run(date);
  }
});
tx();
console.log('  ✅ 3条交易记录已添加');

console.log('\n=== 验证可开发票交易 ===');
const available = db.prepare("SELECT id, end_time, final_amount, invoice_status FROM transactions WHERE member_id = 1 AND invoice_status = 'not_issued' ORDER BY end_time DESC").all();
console.log('  可开发票交易数:', available.length);
available.forEach(t => console.log('  ID:', t.id, '时间:', t.end_time, '金额:', t.final_amount));

console.log('\n=== 会员1完整数据 ===');
const all = db.prepare(`
  SELECT t.id, t.end_time, t.final_amount, t.invoice_status, i.status as invoice_status2
  FROM transactions t
  LEFT JOIN invoices i ON t.id = i.transaction_id
  WHERE t.member_id = 1
  ORDER BY t.end_time DESC
`).all();
console.log('  总交易数:', all.length);
all.forEach(t => console.log('  ID:', t.id, '金额:', t.final_amount, '状态:', t.invoice_status, '发票:', t.invoice_status2 || '无'));
