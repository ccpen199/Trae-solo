import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const scriptPath = fs.realpathSync(process.argv[1]);
const scriptDir = path.dirname(scriptPath);
const dbPath = path.join(scriptDir, '../../data/app.sqlite');

console.log('=== 更新已开票订单状态 ===\n');
console.log('数据库路径:', dbPath);

const db = new Database(dbPath);

const invoices = db.prepare(`
  SELECT order_no, status, invoice_no 
  FROM invoice_requests 
  WHERE status IN ('delivered', 'settled', 'red_credited')
`).all();

console.log('\n发现以下已开票的发票:');
invoices.forEach(inv => {
  console.log(`  - 订单号: ${inv.order_no}, 发票状态: ${inv.status}, 发票号: ${inv.invoice_no || 'N/A'}`);
});

const updateResult = db.prepare(`
  UPDATE business_orders 
  SET status = 'settled'
  WHERE order_no IN (
    SELECT order_no FROM invoice_requests 
    WHERE status IN ('delivered', 'settled', 'red_credited')
  )
  AND status != 'settled'
`).run();

console.log(`\n更新了 ${updateResult.changes} 个订单的状态为 '已结票'`);

const updatedOrders = db.prepare(`
  SELECT order_no, customer_name, amount, status 
  FROM business_orders 
  ORDER BY created_at DESC
`).all();

console.log('\n=== 当前订单状态 ===');
const statusMap = {
  'pending': '待开票',
  'invoiced': '已开票',
  'settled': '已结票'
};
updatedOrders.forEach(o => {
  console.log(`  - 订单: ${o.order_no}, 客户: ${o.customer_name}, 金额: ${o.amount}, 状态: ${statusMap[o.status] || o.status}`);
});

db.close();
console.log('\n完成!');
