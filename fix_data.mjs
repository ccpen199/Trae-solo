import db from './backend/src/db/database.ts';

console.log('=== 查看骑手状态 ===');
const knights = db.prepare('SELECT id, name, status, current_load, credit_score FROM knights').all();
knights.forEach(k => {
  console.log(`  ${k.id}. ${k.name}: status=${k.status}, load=${k.current_load}, credit=${k.credit_score}`);
});

console.log('\n=== 骑手1的进行中订单 ===');
const orders = db.prepare(`
  SELECT id, order_no, status, knight_id 
  FROM waybills 
  WHERE knight_id = 1 AND status IN ('accepted', 'picked_up', 'delivering')
`).all();
orders.forEach(o => {
  console.log(`  ${o.id}. ${o.order_no}: status=${o.status}`);
});

console.log('\n=== 待处理异常 ===');
const exs = db.prepare(`
  SELECT id, waybill_id, type, status, original_knight_id, new_knight_id 
  FROM exceptions 
  WHERE status = 'pending' 
  LIMIT 5
`).all();
exs.forEach(e => {
  console.log(`  ${e.id}: type=${e.type}, waybill=${e.waybill_id}, orig=${e.original_knight_id}, new=${e.new_knight_id}`);
});

console.log('\n=== 检查骑士表约束 ===');
const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='knights'").get();
console.log('SQL:', sql.sql);
