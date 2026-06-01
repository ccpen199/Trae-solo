import Database from 'better-sqlite3';
const db = new Database('./data/app.sqlite');
console.log('应用数:', db.prepare('SELECT COUNT(*) as c FROM applications').get().c);
console.log('环境数:', db.prepare('SELECT COUNT(*) as c FROM environments').get().c);
console.log('策略数:', db.prepare('SELECT COUNT(*) as c FROM backup_strategies').get().c);
console.log('任务数:', db.prepare('SELECT COUNT(*) as c FROM tasks').get().c);
console.log('应用列表:', db.prepare('SELECT id, app_code FROM applications').all());
console.log('环境列表:', db.prepare('SELECT id, app_id, env_name FROM environments').all());
db.close();
