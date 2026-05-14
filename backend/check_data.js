const Database = require('better-sqlite3');
const db = new Database('./data/app.sqlite');

console.log('=== 商品数量 ===');
console.log(db.prepare('SELECT COUNT(*) as count FROM products').get());
console.log('=== 帖子数量 ===');
console.log(db.prepare('SELECT COUNT(*) as count FROM posts').get());
console.log('=== 按内容类型分组 ===');
console.log(db.prepare('SELECT content_type, COUNT(*) as count FROM posts GROUP BY content_type').all());
console.log('=== 产品吧数量 ===');
console.log(db.prepare('SELECT COUNT(*) as count FROM product_bars').get());
console.log('=== 用户数量 ===');
console.log(db.prepare('SELECT COUNT(*) as count FROM users').get());
console.log('=== 商品列表 ===');
console.log(db.prepare('SELECT id, name, cover_image FROM products').all());

db.close();
