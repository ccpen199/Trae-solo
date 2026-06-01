import db from './init.js';

console.log('=== users 表结构 ===');
const userColumns = db.prepare('PRAGMA table_info(users)').all() as any[];
userColumns.forEach(col => {
  console.log(`${col.name}: ${col.type}`);
});

console.log('\n=== 现有用户 ===');
const users = db.prepare('SELECT id, email, role, name FROM users').all() as any[];
console.log(users);

console.log('\n=== jobs 表结构 ===');
const jobColumns = db.prepare('PRAGMA table_info(jobs)').all() as any[];
jobColumns.forEach(col => {
  console.log(`${col.name}: ${col.type}`);
});

console.log('\n=== 现有岗位 ===');
const jobs = db.prepare('SELECT id, title FROM jobs').all() as any[];
console.log('岗位数量:', jobs.length);
jobs.slice(0, 5).forEach(job => {
  console.log(`- ${job.title}`);
});
