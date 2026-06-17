const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'app.sqlite'));

console.log('=== 修复验证报告 ===\n');

// 1. 检查GPS总数
const gpsTotal = db.prepare('SELECT COUNT(*) as count FROM gps_tracks').get().count;
console.log(`1. GPS总数: ${gpsTotal}`);
console.log(`   验证结果: ${gpsTotal > 20 ? '✅ 通过 (> 20)' : '❌ 失败 (≤ 20)'}\n`);

// 2. 检查labor_order_bids总数
const bidsTotal = db.prepare('SELECT COUNT(*) as count FROM labor_order_bids').get().count;
console.log(`2. labor_order_bids总数: ${bidsTotal}`);
console.log(`   验证结果: ${bidsTotal > 0 ? '✅ 通过 (> 0)' : '❌ 失败 (≤ 0)'}\n`);

// 3. 检查每个in_progress/completed订单至少5个GPS点
console.log('3. 每个in_progress/completed订单的GPS点数:');

const laborOrders = db.prepare(`
  SELECT id, status FROM labor_orders WHERE status IN ('in_progress', 'completed')
`).all();

const deliveryOrders = db.prepare(`
  SELECT id, status FROM delivery_orders WHERE status IN ('in_progress', 'completed')
`).all();

const movingOrders = db.prepare(`
  SELECT id, status FROM moving_orders WHERE status IN ('in_progress', 'accepted', 'completed')
`).all();

let allOrdersHaveEnoughGPS = true;
const allOrders = [];

laborOrders.forEach(o => allOrders.push({ ...o, type: 'labor' }));
deliveryOrders.forEach(o => allOrders.push({ ...o, type: 'delivery' }));
movingOrders.forEach(o => allOrders.push({ ...o, type: 'moving' }));

allOrders.forEach(order => {
  const count = db.prepare(
    'SELECT COUNT(*) as count FROM gps_tracks WHERE order_id = ? AND order_type = ?'
  ).get(order.id, order.type).count;
  const status = count >= 5 ? '✅' : '❌';
  if (count < 5) allOrdersHaveEnoughGPS = false;
  console.log(`   ${status} [${order.type}] ${order.id.substring(0, 8)}... (${order.status}): ${count} 个GPS点`);
});

console.log(`\n   验证结果: ${allOrdersHaveEnoughGPS ? '✅ 所有订单都有至少5个GPS点' : '❌ 部分订单GPS点不足'}\n`);

// 4. 检查pending订单的bids记录
console.log('4. 每个pending用工订单的bids数:');
const pendingLaborOrders = db.prepare(`
  SELECT id, status FROM labor_orders WHERE status = 'pending'
`).all();

let allPendingHaveBids = true;
pendingLaborOrders.forEach(order => {
  const count = db.prepare(
    'SELECT COUNT(*) as count FROM labor_order_bids WHERE order_id = ?'
  ).get(order.id).count;
  const status = count >= 2 ? '✅' : '❌';
  if (count < 2) allPendingHaveBids = false;
  console.log(`   ${status} ${order.id.substring(0, 8)}...: ${count} 条bids`);
});

console.log(`\n   验证结果: ${allPendingHaveBids ? '✅ 所有pending订单都有至少2条bids' : '❌ 部分pending订单bids不足'}\n`);

// 5. 显示bids详情
console.log('5. labor_order_bids详情:');
const bids = db.prepare('SELECT * FROM labor_order_bids').all();
bids.forEach(bid => {
  console.log(`   - ${bid.id.substring(0, 8)}... order: ${bid.order_id.substring(0, 8)}..., worker: ${bid.worker_id.substring(0, 8)}..., status: ${bid.status}`);
});

console.log('\n=== 验证完成 ===');
db.close();
