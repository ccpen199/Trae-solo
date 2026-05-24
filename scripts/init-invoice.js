const db = require('../backend/src/db');

console.log('=== 1. 修复历史交易 invoice_status ===');
const updateResult = db.prepare("UPDATE transactions SET invoice_status = 'not_issued' WHERE invoice_status = 'none' AND member_id IS NOT NULL").run();
console.log('  更新行数:', updateResult.changes);

console.log('\n=== 2. 给会员1插入测试发票数据（待开具）===');
const tx = db.transaction(() => {
  db.prepare(`
    INSERT INTO invoices (transaction_id, member_id, invoice_type, invoice_title, tax_number, amount, status)
    VALUES (1, 1, 'personal', '张三', NULL, 377.88, 'pending')
  `).run();
  
  db.prepare("UPDATE transactions SET invoice_status = 'pending' WHERE id = 1").run();
});
tx();
console.log('  ✅ 发票申请已创建');

console.log('\n=== 3. 新增一条已开发票（会员1）===');
const tx2 = db.transaction(() => {
  db.prepare(`
    INSERT INTO invoices (transaction_id, member_id, invoice_type, invoice_title, tax_number, amount, status, invoice_number, issued_at)
    VALUES (2, 1, 'company', '北京科技有限公司', '91110000MA12345678', 581.75, 'issued', '00123456', '2026-05-20 10:00:00')
  `).run();
  
  db.prepare("UPDATE transactions SET invoice_status = 'issued' WHERE id = 2").run();
});
tx2();
console.log('  ✅ 已开发票已创建');

console.log('\n=== 4. 验证数据 ===');
const memberInvoices = db.prepare(`
  SELECT i.*, t.end_time as transaction_time, s.name as station_name 
  FROM invoices i 
  JOIN transactions t ON i.transaction_id = t.id 
  JOIN stations s ON t.station_id = s.id 
  WHERE i.member_id = 1 
  ORDER BY i.created_at DESC
`).all();
console.log('  会员1发票总数:', memberInvoices.length);
memberInvoices.forEach(i => {
  console.log('  ID:', i.id, '金额:', i.amount, '状态:', i.status, '抬头:', i.invoice_title);
});

console.log('\n=== 5. 可开发票交易 ===');
const available = db.prepare("SELECT id, end_time, final_amount, invoice_status FROM transactions WHERE member_id = 1 AND invoice_status = 'not_issued'").all();
console.log('  可开发票交易数:', available.length);
available.forEach(t => console.log('  ID:', t.id, '金额:', t.final_amount, '状态:', t.invoice_status));

console.log('\n✅ 初始化完成');
