const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

console.log('=== 现有数据 ===');
console.log('申请记录:', db.prepare('SELECT COUNT(*) as c FROM job_matches').get().c);
console.log('打卡记录:', db.prepare('SELECT COUNT(*) as c FROM attendances').get().c);
console.log('今日打卡:', db.prepare("SELECT COUNT(*) as c FROM attendances WHERE DATE(created_at) = DATE('now')").get().c);

console.log('\n=== 添加今日打卡记录 ===');
const inProgressMatch = db.prepare("SELECT id, worker_id FROM job_matches WHERE status IN ('accepted', 'in_progress') LIMIT 1").get();
if (inProgressMatch) {
  const now = new Date();
  now.setHours(8, 0, 0, 0);
  
  const result = db.prepare(`
    INSERT OR IGNORE INTO attendances (job_match_id, worker_id, check_in_time, hours_worked, location_verified, confirmed, created_at)
    VALUES (?, ?, ?, 0, 1, 0, ?)
  `).run(inProgressMatch.id, inProgressMatch.worker_id || 1, now.toISOString(), now.toISOString());
  
  console.log('✅ 添加今日打卡:', result.changes > 0 ? '成功' : '已存在');
}

console.log('\n=== 验证 ===');
console.log('今日打卡:', db.prepare("SELECT COUNT(*) as c FROM attendances WHERE DATE(created_at) = DATE('now')").get().c);

console.log('\n=== 过程保障数据 ===');
console.log('保证金记录:', db.prepare("SELECT COUNT(*) as c FROM payments WHERE type = 'deposit'").get().c);
console.log('工资支付记录:', db.prepare("SELECT COUNT(*) as c FROM payments WHERE type = 'salary'").get().c);
console.log('合同记录:', db.prepare('SELECT COUNT(*) as c FROM contracts').get().c);
console.log('纠纷记录:', db.prepare('SELECT COUNT(*) as c FROM labor_disputes').get().c);

console.log('\n=== 详细业务数据 ===');
const matches = db.prepare(`
  SELECT jm.*, jp.title, jp.daily_salary, 
         CASE 
           WHEN jm.worker_id IS NOT NULL THEN 'worker'
           WHEN jm.team_id IS NOT NULL THEN 'team'
           ELSE 'unknown'
         END as applicant_type
  FROM job_matches jm
  JOIN job_posts jp ON jm.job_id = jp.id
  ORDER BY jm.created_at DESC
`).all();

console.log('\n申请记录列表:');
matches.forEach(m => {
  console.log(`  ${m.status.toUpperCase()}: ${m.title} (${m.applicant_type}, 匹配度: ${m.match_score}%)`);
});

const payments = db.prepare(`
  SELECT p.*, jp.title
  FROM payments p
  JOIN job_matches jm ON p.job_match_id = jm.id
  JOIN job_posts jp ON jm.job_id = jp.id
  ORDER BY p.created_at DESC
`).all();

console.log('\n支付记录列表:');
payments.forEach(p => {
  console.log(`  ${p.type}: ¥${p.amount} - ${p.title} (${p.status})`);
});

db.close();
console.log('\n✅ 完成');
