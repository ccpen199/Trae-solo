const db = require('better-sqlite3')('backend/database.db');

console.log('=== 钱七(driver_id=5)关联车辆 ===');
const bind = db.prepare('SELECT * FROM driver_vehicle_bind WHERE driver_id=5').all();
console.log('driver_vehicle_bind:', bind);
const v5 = db.prepare('SELECT * FROM vehicles WHERE id=5').get();
console.log('vehicle_id=5:', v5 ? v5.plate_no + ', platform_id=' + v5.platform_id + ', audit_status=' + v5.audit_status : 'not found');

console.log('\n=== 订单表中driver_id=5 ===');
const orders5 = db.prepare('SELECT * FROM orders WHERE driver_id=5').all();
console.log('orders count:', orders5.length);

console.log('\n=== 平台1所有订单 ===');
const orders = db.prepare('SELECT id, driver_id, vehicle_id, order_no FROM orders WHERE platform_id=1 ORDER BY id').all();
orders.forEach(o => console.log('  order_id=' + o.id + ', driver_id=' + o.driver_id + ', vehicle_id=' + o.vehicle_id + ', order_no=' + o.order_no));

console.log('\n=== 平台1所有司机 ===');
const drivers = db.prepare('SELECT id,name,platform_id FROM drivers WHERE platform_id=1').all();
drivers.forEach(d => console.log('  driver_id=' + d.id + ', name=' + d.name));

console.log('\n=== 平台1所有车辆 ===');
const vehicles = db.prepare('SELECT id,plate_no,platform_id FROM vehicles WHERE platform_id=1').all();
vehicles.forEach(v => console.log('  vehicle_id=' + v.id + ', plate_no=' + v.plate_no));

console.log('\n=== 给driver_id=5补齐关联数据 ===');
const tx = db.transaction(() => {
  db.prepare('INSERT OR IGNORE INTO driver_vehicle_bind (driver_id, vehicle_id, bind_date, status) VALUES (?, ?, ?, ?)')
    .run(5, 5, '2023-01-01', 'active');
  
  // 把platform_id=1的10单分配给driver_id=5（原先是driver_id=1-3各10单）
  db.prepare('UPDATE orders SET driver_id=5, vehicle_id=5 WHERE platform_id=1 AND id IN (SELECT id FROM orders WHERE platform_id=1 ORDER BY id DESC LIMIT 5)')
    .run();
  
  console.log('已补齐driver_vehicle_bind和5个订单');
});
tx();

console.log('\n=== 补齐后验证 ===');
const orders5after = db.prepare('SELECT id, order_no, driver_id, vehicle_id FROM orders WHERE driver_id=5').all();
console.log('钱七订单数:', orders5after.length);
orders5after.forEach(o => console.log('  ' + o.order_no));
const bindAfter = db.prepare('SELECT * FROM driver_vehicle_bind WHERE driver_id=5').all();
console.log('绑定车辆:', bindAfter.length, '辆');
