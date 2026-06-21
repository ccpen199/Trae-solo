const db = require('./src/utils/db');

console.log('=== (1) DB 验证：窗口排队&建议窗 ===');
const outlets = db.prepare(`
  SELECT o.id, o.name, o.window_count total,
         SUM(CASE WHEN w.is_open=1 THEN 1 ELSE 0 END) open_w,
         SUM(CASE WHEN w.is_open=0 THEN 1 ELSE 0 END) close_w,
         SUM(w.current_queue) queue
  FROM service_outlets o
  LEFT JOIN window_resources w ON o.id=w.outlet_id
  GROUP BY o.id
`).all();
outlets.forEach(o => {
  const suggest = Math.max(o.open_w||5, Math.ceil((o.queue||0)/8));
  console.log(`  [${o.id}] ${o.name}: 总${o.total}窗 开${o.open_w} 关${o.close_w} 排队${o.queue}人 建议${suggest}窗`);
});

console.log('\n=== 今日预约统计 ===');
db.prepare("SELECT status, COUNT(*) c FROM appointments WHERE appointment_date = date('now','localtime') GROUP BY status")
  .all().forEach(x => console.log(`  ${x.status}: ${x.c}人`));

console.log('\n=== 身份码 ===');
db.prepare('SELECT is_offline, COUNT(*) c FROM identity_codes GROUP BY is_offline')
  .all().forEach(x => console.log(`  ${x.is_offline ? '离线码' : '动态码'}: ${x.c} 条`));

console.log('\n=== 热度预测/日志/代办 ===');
console.log('  今日预测条数:', db.prepare('SELECT COUNT(*) c FROM heat_predictions WHERE predict_date=date("now","localtime")').get().c);
console.log('  日志总数:', db.prepare('SELECT COUNT(*) c FROM operation_logs').get().c);
console.log('  代办操作数:', db.prepare('SELECT COUNT(*) c FROM agent_operations').get().c);
console.log('  授权数:', db.prepare('SELECT COUNT(*) c FROM agent_authorizations').get().c);
