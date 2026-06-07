import { getDb } from './api/db/index.js';

const db = getDb();

console.log('=== 测试商品数据 ===');
const products = db.prepare('SELECT id, name, festival, price FROM products LIMIT 3').all();
console.log(JSON.stringify(products, null, 2));

console.log('');
console.log('=== 测试 LIKE 查询 ===');
const result = db.prepare('SELECT id, name, festival FROM products WHERE festival LIKE ?').all('%"情人节"%');
console.log(JSON.stringify(result, null, 2));

console.log('');
console.log('=== 测试带价格筛选 ===');
const result2 = db.prepare('SELECT id, name, festival, price FROM products WHERE festival LIKE ? AND price >= ? AND price <= ?').all('%"情人节"%', 0, 300);
console.log(JSON.stringify(result2, null, 2));
