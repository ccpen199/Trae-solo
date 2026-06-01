const Database = require('better-sqlite3');
const db = new Database('data/app.sqlite');

const orders = [
  ['ORD202605250001', 2, 1, 3, 10, 1, 10, '直播', '主播加油！', 1, 'success', null, '2026-05-25 19:30:00'],
  ['ORD202605250002', 2, 3, 3, 5, 10, 50, '直播', '送你玫瑰花', 2, 'success', null, '2026-05-25 19:35:00'],
  ['ORD202605250003', 2, 4, 3, 2, 100, 200, '直播', '皇冠给你', 3, 'success', null, '2026-05-25 20:00:00'],
  ['ORD202605250004', 2, 2, 3, 3, 5, 15, '社区', '棒棒哒', null, 'success', null, '2026-05-25 20:10:00'],
  ['ORD202605250005', 2, 5, 3, 1, 500, 500, '直播', '火箭起飞！', 3, 'success', null, '2026-05-25 21:00:00'],
  ['ORD202605260001', 2, 6, 3, 1, 1000, 1000, '直播', '城堡送给你', 2, 'success', null, '2026-05-26 14:00:00'],
  ['ORD202605260002', 2, 4, 3, 5, 100, 500, '直播', '再来几个皇冠', null, 'success', null, '2026-05-26 15:30:00'],
  ['ORD202605260003', 2, 2, 3, 10, 5, 50, '社区', '支持一下', null, 'success', null, '2026-05-26 16:00:00'],
  ['ORD202605260004', 2, 3, 3, 20, 10, 200, '直播', '520快乐！', 2, 'success', null, '2026-05-26 18:00:00']
];

const stmt = db.prepare('INSERT INTO gift_orders (order_no, user_id, gift_id, receiver_id, quantity, unit_price, total_amount, scene, message, activity_id, status, fail_reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

for (const o of orders) {
  stmt.run(...o);
}

db.prepare('UPDATE users SET balance = 1000 WHERE id = 2').run();
db.prepare('UPDATE users SET balance = 1500 WHERE id = 3').run();

console.log('插入完成');
const stats = db.prepare('SELECT status, COUNT(*) as count, SUM(total_amount) as amount FROM gift_orders GROUP BY status').all();
console.log('订单统计:', stats);
