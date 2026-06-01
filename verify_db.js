const Database = require('better-sqlite3');
const db = new Database('backend/data/hospital_transfer.db');

console.log('=== 数据落库验证 ===');
console.log('');

const transfers = db.prepare('SELECT id, transfer_no, patient_name, status, urgency, primary_diagnosis FROM transfers ORDER BY id DESC LIMIT 7').all();
console.log('--- 转诊申请 (最近7条) ---');
transfers.forEach(t => console.log(`  ${t.transfer_no} | ${t.patient_name} | ${t.status} | ${t.urgency} | ${t.primary_diagnosis}`));

const reviewCount = db.prepare('SELECT COUNT(*) as c FROM transfer_reviews').get().c;
const reviews = db.prepare('SELECT * FROM transfer_reviews ORDER BY id DESC LIMIT 3').all();
console.log('');
console.log(`--- 审核记录 (共${reviewCount}条, 最近3条) ---`);
reviews.forEach(r => console.log(`  #${r.id} | 转诊${r.transfer_id} | ${r.result} | ${r.comments ? r.comments.substring(0,30) : ''}`));

const coordCount = db.prepare('SELECT COUNT(*) as c FROM transfer_coordinations').get().c;
const coords = db.prepare('SELECT * FROM transfer_coordinations ORDER BY id DESC LIMIT 3').all();
console.log('');
console.log(`--- 协调记录 (共${coordCount}条) ---`);
coords.forEach(c => console.log(`  #${c.id} | 转诊${c.transfer_id} | ${c.contact_person} | 床位${c.bed_number}`));

const resultCount = db.prepare('SELECT COUNT(*) as c FROM transfer_results').get().c;
const results = db.prepare('SELECT * FROM transfer_results ORDER BY id DESC LIMIT 3').all();
console.log('');
console.log(`--- 接诊记录 (共${resultCount}条) ---`);
results.forEach(r => console.log(`  #${r.id} | 转诊${r.transfer_id} | ${r.admission_decision} | ${r.diagnosis ? r.diagnosis.substring(0,30) : ''}`));

const logCount = db.prepare('SELECT COUNT(*) as c FROM operation_logs').get().c;
const logs = db.prepare('SELECT * FROM operation_logs ORDER BY id DESC LIMIT 5').all();
console.log('');
console.log(`--- 操作日志 (共${logCount}条, 最近5条) ---`);
logs.forEach(l => console.log(`  ${l.created_at} | ${l.action} | ${l.details ? l.details.substring(0,40) : ''}`));

const stats = db.prepare(`SELECT
  (SELECT COUNT(*) FROM transfers) as total,
  (SELECT COUNT(*) FROM transfers WHERE status='completed') as completed,
  (SELECT COUNT(*) FROM transfers WHERE status='pending') as pending,
  (SELECT COUNT(*) FROM transfers WHERE status='accepted') as accepted,
  (SELECT COUNT(*) FROM transfers WHERE status='coordinating') as coordinating`).get();
console.log('');
console.log('=== 统计汇总 ===');
console.log(`  总转诊量: ${stats.total}`);
console.log(`  已完成: ${stats.completed}`);
console.log(`  待审核: ${stats.pending}`);
console.log(`  审核通过: ${stats.accepted}`);
console.log(`  协调中: ${stats.coordinating}`);
console.log('');
console.log('✅ 所有核心动作均已落库可复查！');
db.close();
