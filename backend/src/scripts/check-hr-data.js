const db = require('../db');

console.log('=== Users ===');
const users = db.prepare('SELECT id, username, role FROM users').all();
console.log(users);

console.log('\n=== hr1 user ===');
const hr1 = db.prepare('SELECT id, username, role FROM users WHERE username = ?').get('hr1');
console.log(hr1);

console.log('\n=== Enterprises ===');
const enterprises = db.prepare('SELECT id, enterprise_name, user_id, qualification_status FROM enterprises').all();
console.log(enterprises);

console.log('\n=== Jobs with enterprise ===');
const jobs = db.prepare(`
  SELECT j.id, j.job_title, j.enterprise_id, e.enterprise_name, e.user_id as enterprise_user_id
  FROM jobs j
  JOIN enterprises e ON j.enterprise_id = e.id
`).all();
console.log(jobs);

console.log('\n=== Applications with job and enterprise ===');
const apps = db.prepare(`
  SELECT a.id, a.status, a.job_id, j.job_title, j.enterprise_id, e.enterprise_name, e.user_id as enterprise_user_id
  FROM applications a
  JOIN jobs j ON a.job_id = j.id
  JOIN enterprises e ON j.enterprise_id = e.id
`).all();
console.log(apps);
