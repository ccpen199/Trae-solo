const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'data', 'app.sqlite');
const db = new Database(dbPath);

console.log('=== 商品数量 ===');
console.log(db.prepare('SELECT COUNT(*) as count FROM products').get());
console.log('=== 帖子数量 ===');
console.log(db.prepare('SELECT COUNT(*) as count FROM posts').get());
console.log('=== 按内容类型分组 ===');
console.log(db.prepare('SELECT content_type, COUNT(*) as count FROM posts GROUP BY content_type').all());
console.log('=== 产品吧数量 ===');
console.log(db.prepare('SELECT COUNT(*) as count FROM product_bars').get());

db.close();
