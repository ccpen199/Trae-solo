const Database = require('better-sqlite3');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.resolve(PROJECT_DIR, './data/app.sqlite');
const db = new Database(DB_PATH);

console.log('='.repeat(60));
console.log('🔧 修复所有数据一致性和统计口径问题');
console.log('='.repeat(60));

// ============================================================
// 1. 修复时间顺序 - 所有时间更新为2026年，且逻辑递增
// ============================================================
console.log('\n📅 1. 修复时间顺序...');

const jobUpdates = [
  { id: 1, created_at: '2026-05-20 10:00:00', updated_at: '2026-05-26 14:00:00', start_date: '2026-07-01', end_date: '2026-12-31' },
  { id: 2, created_at: '2026-05-22 09:30:00', updated_at: '2026-05-28 11:00:00', start_date: '2026-07-10', end_date: '2026-12-31' },
  { id: 3, created_at: '2026-06-01 14:00:00', updated_at: '2026-06-01 14:00:00', start_date: '2026-07-15', end_date: '2026-10-15' },
  { id: 4, created_at: '2026-05-25 08:00:00', updated_at: '2026-05-31 16:00:00', start_date: '2026-07-05', end_date: '2026-11-30' },
  { id: 5, created_at: '2026-05-28 15:00:00', updated_at: '2026-06-03 10:00:00', start_date: '2026-07-20', end_date: '2027-01-31' },
  { id: 6, created_at: '2026-06-03 11:00:00', updated_at: '2026-06-04 09:00:00', start_date: '2026-08-01', end_date: '2026-12-31' },
  { id: 7, created_at: '2026-06-02 16:00:00', updated_at: '2026-06-05 14:00:00', start_date: '2026-07-25', end_date: '2027-02-28' },
  { id: 8, created_at: '2026-05-30 10:00:00', updated_at: '2026-06-06 08:00:00', start_date: '2026-07-15', end_date: '2026-11-30' },
];

const updateJobStmt = db.prepare(`
  UPDATE job_requirements 
  SET created_at = ?, updated_at = ?, start_date = ?, end_date = ?,
      status = CASE id
        WHEN 1 THEN 'published'
        WHEN 2 THEN 'published'
        WHEN 3 THEN 'pending_review'
        WHEN 4 THEN 'published'
        WHEN 5 THEN 'published'
        WHEN 6 THEN 'ai_reviewed'
        WHEN 7 THEN 'manual_reviewed'
        WHEN 8 THEN 'published'
      END
  WHERE id = ?
`);

db.transaction(() => {
  jobUpdates.forEach(j => {
    updateJobStmt.run(j.created_at, j.updated_at, j.start_date, j.end_date, j.id);
    console.log(`   ✓ Job ${j.id}: ${j.created_at} → ${j.updated_at}`);
  });
})();

// 修复审核记录时间 - 每个job的三次审核时间递增，且晚于创建时间
const reviewUpdates = [
  // job 1
  { job_id: 1, review_level: 'ai',    review_date: '2026-05-21 09:00:00', created_at: '2026-05-21 09:00:00' },
  { job_id: 1, review_level: 'manual', review_date: '2026-05-22 14:00:00', created_at: '2026-05-22 14:00:00' },
  { job_id: 1, review_level: 'site',   review_date: '2026-05-24 10:00:00', created_at: '2026-05-24 10:00:00' },
  // job 2
  { job_id: 2, review_level: 'ai',    review_date: '2026-05-23 10:00:00', created_at: '2026-05-23 10:00:00' },
  { job_id: 2, review_level: 'manual', review_date: '2026-05-24 15:00:00', created_at: '2026-05-24 15:00:00' },
  { job_id: 2, review_level: 'site',   review_date: '2026-05-26 11:00:00', created_at: '2026-05-26 11:00:00' },
  // job 4
  { job_id: 4, review_level: 'ai',    review_date: '2026-05-26 09:00:00', created_at: '2026-05-26 09:00:00' },
  { job_id: 4, review_level: 'manual', review_date: '2026-05-27 14:00:00', created_at: '2026-05-27 14:00:00' },
  { job_id: 4, review_level: 'site',   review_date: '2026-05-29 10:00:00', created_at: '2026-05-29 10:00:00' },
  // job 5
  { job_id: 5, review_level: 'ai',    review_date: '2026-05-29 10:00:00', created_at: '2026-05-29 10:00:00' },
  { job_id: 5, review_level: 'manual', review_date: '2026-05-30 14:00:00', created_at: '2026-05-30 14:00:00' },
  { job_id: 5, review_level: 'site',   review_date: '2026-06-01 11:00:00', created_at: '2026-06-01 11:00:00' },
  // job 6
  { job_id: 6, review_level: 'ai',    review_date: '2026-06-04 09:00:00', created_at: '2026-06-04 09:00:00' },
  // job 7
  { job_id: 7, review_level: 'ai',    review_date: '2026-06-03 10:00:00', created_at: '2026-06-03 10:00:00' },
  { job_id: 7, review_level: 'manual', review_date: '2026-06-05 14:00:00', created_at: '2026-06-05 14:00:00' },
  // job 8
  { job_id: 8, review_level: 'ai',    review_date: '2026-05-31 10:00:00', created_at: '2026-05-31 10:00:00' },
  { job_id: 8, review_level: 'manual', review_date: '2026-06-02 14:00:00', created_at: '2026-06-02 14:00:00' },
  { job_id: 8, review_level: 'site',   review_date: '2026-06-04 10:00:00', created_at: '2026-06-04 10:00:00' },
];

const updateReviewStmt = db.prepare(`
  UPDATE review_records 
  SET review_date = ?, created_at = ?
  WHERE job_id = ? AND review_level = ?
`);

db.transaction(() => {
  reviewUpdates.forEach(r => {
    updateReviewStmt.run(r.review_date, r.created_at, r.job_id, r.review_level);
    console.log(`   ✓ Review job=${r.job_id}, level=${r.review_level}: ${r.review_date}`);
  });
})();

// 修复合同时间
const contractUpdates = [
  { id: 1, start_date: '2026-07-01', end_date: '2026-12-31', worker_signed_at: '2026-05-28', employer_signed_at: '2026-05-29' },
  { id: 2, start_date: '2026-07-01', end_date: '2026-12-31', worker_signed_at: '2026-05-28', employer_signed_at: null },
  { id: 3, start_date: '2026-07-10', end_date: '2027-03-31', worker_signed_at: null, employer_signed_at: '2026-06-01' },
  { id: 4, start_date: '2026-08-15', end_date: '2027-04-30', worker_signed_at: null, employer_signed_at: null },
];

const updateContractStmt = db.prepare(`
  UPDATE contracts 
  SET start_date = ?, end_date = ?, worker_signed_at = ?, employer_signed_at = ?
  WHERE id = ?
`);

db.transaction(() => {
  contractUpdates.forEach(c => {
    updateContractStmt.run(c.start_date, c.end_date, c.worker_signed_at, c.employer_signed_at, c.id);
  });
  console.log('   ✓ 合同时间已更新');
})();

// 修复工资支付时间
const paymentUpdates = [
  { id: 1, payment_date: '2026-06-01' },
  { id: 2, payment_date: '2026-06-03' },
  { id: 3, payment_date: '2026-06-07' },
  { id: 4, payment_date: '2026-06-05' },
  { id: 5, payment_date: '2026-06-06' },
];

const updatePaymentStmt = db.prepare(`
  UPDATE wage_payments SET payment_date = ? WHERE id = ?
`);

db.transaction(() => {
  paymentUpdates.forEach(p => {
    updatePaymentStmt.run(p.payment_date, p.id);
  });
  console.log('   ✓ 工资支付时间已更新');
})();

// 修复工人相关时间
const workerHealthUpdates = [
  { id: 1, health_code_updated_at: '2026-06-01' },
  { id: 2, health_code_updated_at: '2026-06-02' },
  { id: 3, health_code_updated_at: '2026-06-03' },
  { id: 4, health_code_updated_at: '2026-06-01' },
  { id: 5, health_code_updated_at: '2026-06-04' },
  { id: 6, health_code_updated_at: '2026-06-05' },
  { id: 7, health_code_updated_at: '2026-06-03' },
  { id: 8, health_code_updated_at: '2026-06-02' },
];

const updateWorkerStmt = db.prepare(`
  UPDATE workers SET health_code_updated_at = ? WHERE id = ?
`);

db.transaction(() => {
  workerHealthUpdates.forEach(w => {
    updateWorkerStmt.run(w.health_code_updated_at, w.id);
  });
  console.log('   ✓ 工人健康码更新时间已更新');
})();

// ============================================================
// 2. 修复统计口径问题
// ============================================================
console.log('\n📊 2. 验证并修复统计口径...');

// 检查班组信用按时率计算
const teamStats = db.prepare(`
  SELECT 
    e.company_name,
    COUNT(DISTINCT wp.id) as total_payments,
    COUNT(DISTINCT CASE WHEN wp.status = 'paid' THEN wp.id END) as on_time,
    COUNT(DISTINCT CASE WHEN wp.status = 'overdue' THEN wp.id END) as overdue,
    COUNT(DISTINCT CASE WHEN wp.status = 'pending' THEN wp.id END) as pending,
    COUNT(DISTINCT CASE WHEN wp.status = 'disputed' THEN wp.id END) as disputed,
    e.credit_rating
  FROM employers e
  LEFT JOIN wage_payments wp ON wp.employer_id = e.id
  GROUP BY e.id
`).all();

console.log('\n   雇主支付统计:');
teamStats.forEach(t => {
  const total = (t.on_time || 0) + (t.overdue || 0) + (t.pending || 0);
  const onTimeRate = total > 0 ? Math.round((t.on_time || 0) / Math.max(total, 1) * 100) : 0;
  const safeRate = Math.min(100, Math.max(0, onTimeRate));
  console.log(`   • ${t.company_name}: 总支付${t.total_payments}, 按时${t.on_time}, 逾期${t.overdue}, 待付${t.pending}`);
  console.log(`     按时率: ${safeRate}% (原计算: ${onTimeRate}%)`);
});

// 检查工种紧缺统计
const tradeStats = db.prepare(`
  SELECT 
    t.name,
    COUNT(DISTINCT w.id) as supply,
    SUM(CASE WHEN j.status = 'published' THEN j.quantity ELSE 0 END) as demand
  FROM trades t
  LEFT JOIN workers w ON (',' || replace(replace(w.trade_ids, '[', ''), ']', '') || ',' LIKE '%,' || t.id || ',%')
  LEFT JOIN job_requirements j ON j.trade_id = t.id
  GROUP BY t.id
  HAVING supply > 0 OR demand > 0
  ORDER BY demand DESC
  LIMIT 10
`).all();

console.log('\n   工种供需统计 (过滤供需均为0的):');
tradeStats.forEach((t, i) => {
  const shortage = t.supply > 0 ? (t.demand || 0) / t.supply : (t.demand || 0) > 0 ? 9.99 : 0;
  const flag = shortage > 2 ? '🔴' : shortage > 1 ? '🟡' : '🟢';
  console.log(`   ${flag} ${i+1}. ${t.name}: 供应${t.supply}人, 需求${t.demand || 0}人, 紧缺${shortage.toFixed(2)}`);
});

// ============================================================
// 3. 验证审核记录承接
// ============================================================
console.log('\n🔍 3. 验证审核记录承接...');

const reviewCount = db.prepare('SELECT COUNT(*) as count FROM review_records').get();
console.log(`   审核记录总数: ${reviewCount.count}条`);

const reviewList = db.prepare(`
  SELECT 
    r.id, r.job_id, j.project_name, r.review_level, r.reviewer, 
    r.result, r.comment, r.review_date
  FROM review_records r
  LEFT JOIN job_requirements j ON j.id = r.job_id
  ORDER BY r.review_date DESC
  LIMIT 5
`).all();

console.log('\n   最近审核记录:');
reviewList.forEach(r => {
  const level = r.review_level === 'ai' ? '🤖AI' : r.review_level === 'manual' ? '👨‍💼人工' : '🏗️工地';
  const result = r.result === 'pass' ? '✅通过' : r.result === 'fail' ? '❌驳回' : '⏳待审';
  console.log(`   ${level} ${result} | ${r.project_name} | ${r.reviewer} | ${r.review_date}`);
});

// ============================================================
// 4. 验证招工状态与审核记录一致性
// ============================================================
console.log('\n✅ 4. 验证招工状态与审核记录一致性...');

const jobs = db.prepare(`
  SELECT 
    j.id, j.project_name, j.status,
    COALESCE((SELECT result FROM review_records WHERE job_id = j.id AND review_level = 'ai' ORDER BY created_at DESC LIMIT 1), 'not_started') as ai_status,
    COALESCE((SELECT result FROM review_records WHERE job_id = j.id AND review_level = 'manual' ORDER BY created_at DESC LIMIT 1), 'not_started') as manual_status,
    COALESCE((SELECT result FROM review_records WHERE job_id = j.id AND review_level = 'site' ORDER BY created_at DESC LIMIT 1), 'not_started') as site_status,
    j.created_at
  FROM job_requirements j
  ORDER BY j.id
`).all();

jobs.forEach(j => {
  const statusMap = {
    draft: '📝草稿', pending_review: '⏳待审核', ai_reviewed: '🤖AI审核',
    manual_reviewed: '👨‍💼人工复核', verified: '✅已核验', published: '📢已发布',
    filled: '👥已招满', closed: '🔒已关闭'
  };
  const consistent = 
    (j.status === 'published' && j.ai_status === 'pass' && j.manual_status === 'pass' && j.site_status === 'pass') ||
    (j.status === 'ai_reviewed' && j.ai_status === 'pass' && j.manual_status === 'not_started') ||
    (j.status === 'manual_reviewed' && j.ai_status === 'pass' && j.manual_status === 'pass' && j.site_status === 'not_started') ||
    (j.status === 'pending_review' && j.ai_status === 'not_started');
  
  const flag = consistent ? '✅' : '⚠️';
  console.log(`   ${flag} Job${j.id} ${j.project_name}: ${statusMap[j.status]}`);
  console.log(`      AI:${j.ai_status}, 人工:${j.manual_status}, 工地:${j.site_status}`);
  console.log(`      创建: ${j.created_at}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ 所有数据修复完成！');
console.log('='.repeat(60));

db.close();
