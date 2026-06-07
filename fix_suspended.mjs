import db from './backend/src/db/database.ts';
import { createException, autoReassign } from './backend/src/services/circuitBreaker.ts';

const knightId = 1;

console.log('=== 修复已封禁骑手 Wang Qiang ===');

const activeWaybills = db.prepare(`
  SELECT id FROM waybills
  WHERE knight_id = ? AND status IN ('accepted', 'picked_up', 'delivering')
`).all(knightId);

console.log(`找到 ${activeWaybills.length} 个进行中订单`);

let successCount = 0;
for (const w of activeWaybills) {
  console.log(`\n处理运单 ${w.id}...`);
  const exception = createException(w.id, 'knight_offline', knightId);
  console.log(`  创建异常: ID=${exception.id}`);
  const result = autoReassign(exception.id);
  console.log(`  转派结果: success=${result.success}, message=${result.message}`);
  if (result.success) {
    console.log(`  ✓ 成功转派给骑手 ${result.knight?.name} (ID=${result.knight?.id})`);
    successCount++;
  }
}

console.log(`\n清零骑手 ${knightId} 的负载...`);
db.prepare('UPDATE knights SET current_load = 0 WHERE id = ?').run(knightId);

console.log(`\n=== 修复完成: 成功转派 ${successCount}/${activeWaybills.length} 个订单 ===`);

console.log('\n=== 验证结果 ===');
const k = db.prepare('SELECT id, name, status, current_load, credit_score FROM knights WHERE id = ?').get(knightId);
console.log(`骑手状态: ${k.name}, status=${k.status}, load=${k.current_load}`);

const remaining = db.prepare(`
  SELECT COUNT(*) as count FROM waybills 
  WHERE knight_id = ? AND status IN ('accepted', 'picked_up', 'delivering')
`).get(knightId);
console.log(`剩余进行中订单: ${remaining.count}`);
