const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const db = new Database(dbPath);

db.exec('DELETE FROM reviews');
db.exec('DELETE FROM salary_records');
db.exec('DELETE FROM insurance_policies');
db.exec('DELETE FROM dispute_tickets');
db.exec('DELETE FROM service_nodes');
db.exec('DELETE FROM grab_order_records');
db.exec('DELETE FROM orders');

const count = db.prepare('SELECT COUNT(*) as c FROM orders').get();
console.log('清理后订单数:', count.c);

db.close();
