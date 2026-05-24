const db = require('../backend/src/db');

console.log('=== 1. 交易记录（可开发票）===');
const transactions = db.prepare(`
  SELECT t.id, t.end_time, t.final_amount, t.invoice_status, s.name as station_name 
  FROM transactions t 
  JOIN stations s ON t.station_id = s.id 
  WHERE t.member_id = 1 
  ORDER BY t.end_time DESC
`).all();
transactions.forEach(t => {
  console.log('  ID:', t.id, '时间:', t.end_time, '金额:', t.final_amount, '油站:', t.station_name, '发票状态:', t.invoice_status);
});

console.log('\n=== 2. 已申请的发票记录 ===');
const invoices = db.prepare(`
  SELECT i.*, t.end_time as transaction_time, s.name as station_name 
  FROM invoices i 
  JOIN transactions t ON i.transaction_id = t.id 
  JOIN stations s ON t.station_id = s.id 
  WHERE i.member_id = 1 
  ORDER BY i.created_at DESC
`).all();
console.log('  发票总数:', invoices.length);
invoices.forEach(i => {
  console.log('  ID:', i.id, '交易ID:', i.transaction_id, '金额:', i.amount, '状态:', i.status, '抬头:', i.invoice_title);
});

console.log('\n=== 3. 数据库 invoices 表全量数据 ===');
const allInvoices = db.prepare('SELECT * FROM invoices').all();
console.log('  全表总数:', allInvoices.length);
allInvoices.forEach(i => {
  console.log('  ', JSON.stringify(i));
});

console.log('\n=== 4. 初始化数据检查 ===');
const initSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='invoices'").get();
console.log('  表结构:', initSql.sql);
