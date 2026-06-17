require('dotenv').config();
const path = require('path');
const { initDB, getDB } = require('./dist/db');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
initDB(dbPath);
const db = getDB();

console.log('Testing labor-orders API logic...');

const keyword = '装修';
const city = undefined;
const category = undefined;
const status = undefined;
const page = 1;
const limit = 20;

let whereClause = 'WHERE 1=1';
const params = [];

if (city) {
  whereClause += ' AND lo.city LIKE ?';
  params.push(`%${city}%`);
}
if (category) {
  whereClause += ' AND lo.category = ?';
  params.push(category);
}
if (status) {
  whereClause += ' AND lo.status = ?';
  params.push(status);
}
if (keyword) {
  whereClause += ` AND (
    lo.title LIKE '%' || ? || '%' OR
    lo.description LIKE '%' || ? || '%' OR
    lo.category LIKE '%' || ? || '%' OR
    lo.city LIKE '%' || ? || '%' OR
    lo.address LIKE '%' || ? || '%'
  )`;
  params.push(keyword, keyword, keyword, keyword, keyword);
}

console.log('whereClause:', whereClause);
console.log('params:', params);

const offset = (Number(page) - 1) * Number(limit);

const sql = `
SELECT lo.*, 
       ue.username as employer_name, ue.real_name as employer_real_name, ue.avatar as employer_avatar, ue.phone as employer_phone, ue.credit_score as employer_credit_score,
       uw.username as worker_name, uw.real_name as worker_real_name, uw.avatar as worker_avatar, uw.phone as worker_phone, uw.credit_score as worker_credit_score,
       wp.skills, wp.rating as worker_rating, wp.completed_orders as worker_completed_orders, wp.hourly_rate, wp.task_rate
FROM labor_orders lo
LEFT JOIN users ue ON lo.employer_id = ue.id
LEFT JOIN users uw ON lo.worker_id = uw.id
LEFT JOIN worker_profiles wp ON lo.worker_id = wp.user_id
${whereClause}
ORDER BY lo.created_at DESC
LIMIT ? OFFSET ?
`;

console.log('\nFull SQL:', sql);

try {
  const stmt = db.prepare(sql);
  console.log('Statement prepared successfully');
  const orders = stmt.all(...params, Number(limit), offset);
  console.log('Orders found:', orders.length);
  orders.forEach(o => console.log(' -', o.title));
  
  const countSql = `SELECT COUNT(*) as count FROM labor_orders lo ${whereClause}`;
  const total = db.prepare(countSql).get(...params);
  console.log('Total:', total);
} catch(e) {
  console.log('Error:', e.message);
  console.log('Stack:', e.stack);
}
