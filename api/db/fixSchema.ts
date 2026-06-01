import db from './init.js';

try {
  db.prepare('ALTER TABLE users ADD COLUMN name TEXT').run();
  console.log('✓ 已添加 users.name 字段');
} catch (e) {
  console.log('ℹ users.name 字段已存在');
}

try {
  db.prepare('ALTER TABLE users ADD COLUMN phone TEXT UNIQUE').run();
  console.log('✓ 已添加 users.phone 字段');
} catch (e) {
  console.log('ℹ users.phone 字段已存在');
}

try {
  db.prepare('ALTER TABLE users ADD COLUMN avatar_url TEXT').run();
  console.log('✓ 已添加 users.avatar_url 字段');
} catch (e) {
  console.log('ℹ users.avatar_url 字段已存在');
}

console.log('数据库表结构修复完成!');
