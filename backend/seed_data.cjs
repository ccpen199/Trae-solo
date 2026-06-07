const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/app.sqlite');
const db = new Database(dbPath);

console.log('=== 开始更新数据库 ===\n');

const providerInfo = db.prepare('PRAGMA table_info(providers)').all();
const providerCols = providerInfo.map(c => c.name);
if (!providerCols.includes('reviewer')) {
  db.exec('ALTER TABLE providers ADD COLUMN reviewer TEXT; ALTER TABLE providers ADD COLUMN review_note TEXT');
  console.log('✓ providers表新增字段');
}

const disputeInfo = db.prepare('PRAGMA table_info(disputes)').all();
const disputeCols = disputeInfo.map(c => c.name);
if (!disputeCols.includes('provider_id')) {
  db.exec('ALTER TABLE disputes ADD COLUMN provider_id INTEGER');
  console.log('✓ disputes表新增provider_id');
}
if (!disputeCols.includes('grid_code')) {
  db.exec('ALTER TABLE disputes ADD COLUMN grid_code TEXT');
  console.log('✓ disputes表新增grid_code');
}
if (!disputeCols.includes('reviewer')) {
  db.exec('ALTER TABLE disputes ADD COLUMN reviewer TEXT');
  console.log('✓ disputes表新增reviewer');
}

const settlementInfo = db.prepare('PRAGMA table_info(settlements)').all();
const settlementCols = settlementInfo.map(c => c.name);
if (!settlementCols.includes('reviewer')) {
  db.exec('ALTER TABLE settlements ADD COLUMN reviewer TEXT; ALTER TABLE settlements ADD COLUMN grid_code TEXT');
  console.log('✓ settlements表新增字段');
}

const providers = db.prepare('SELECT id, grid_code FROM providers').all();
console.log(`\n共 ${providers.length} 个服务商`);

const reviewers = ['张主任（街道办）', '李科长（民政科）', '王书记（社区）', '赵委员（综治办）'];
const reviewNotes = [
  '资质齐全，经营规范',
  '服务质量良好，居民满意度高',
  '需补充健康证明材料',
  '经营场所检查合格',
  '从业人员培训合格',
];

const updateProvider = db.prepare(`
  UPDATE providers 
  SET annual_review_date = ?, review_status = ?, reviewer = ?, review_note = ?
  WHERE id = ?
`);

const today = new Date();
providers.forEach((p, idx) => {
  const daysOffset = [15, 30, 45, 60, 90, -15, -30, -60][idx % 8];
  const reviewDate = new Date(today);
  reviewDate.setDate(reviewDate.getDate() + daysOffset);
  const statuses = ['approved', 'pending', 'expired', 'approved', 'approved', 'pending', 'approved', 'expired'];
  const status = statuses[idx % 8];
  const reviewer = reviewers[idx % reviewers.length];
  const note = reviewNotes[idx % reviewNotes.length];
  
  updateProvider.run(reviewDate.toISOString().split('T')[0], status, reviewer, note, p.id);
  console.log(`  服务商#${p.id}: ${status} - ${reviewDate.toISOString().split('T')[0]}`);
});

console.log('\n✓ 服务商年审状态更新完成');

db.exec('DELETE FROM settlements');
const insertSettlement = db.prepare(`
  INSERT INTO settlements (provider_id, period, amount, status, reviewer, grid_code)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const periods = ['2026-04', '2026-05', '2026-06'];
const settlementStatuses = ['completed', 'paid', 'pending', 'completed'];

providers.forEach((p, idx) => {
  periods.forEach((period, pIdx) => {
    const amount = Math.floor(Math.random() * 2000) + 500;
    const status = settlementStatuses[(idx + pIdx) % settlementStatuses.length];
    const reviewer = reviewers[(idx + pIdx) % reviewers.length];
    insertSettlement.run(p.id, period, amount, status, reviewer, p.grid_code);
  });
});

console.log('✓ 结算数据更新完成');

db.exec('DELETE FROM disputes');
const insertDispute = db.prepare(`
  INSERT INTO disputes (demand_id, provider_id, description, status, resolution, reviewer, grid_code)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const disputeDescs = [
  '服务时间与约定不符',
  '服务质量未达预期',
  '酬金结算存在争议',
  '服务商临时爽约',
  '需求描述与实际不符',
];
const disputeStatuses = ['resolved', 'pending', 'rejected', 'resolved', 'pending'];
const resolutions = [
  '双方协商一致，退还50%酬金',
  '服务商致歉并重新服务',
  '驳回申诉，维持原约定',
  '社区调解，各承担一半责任',
  null,
];

providers.slice(0, 10).forEach((p, idx) => {
  const status = disputeStatuses[idx % disputeStatuses.length];
  const resolution = status === 'pending' ? null : resolutions[idx % resolutions.length];
  insertDispute.run(
    idx + 1, p.id, disputeDescs[idx % disputeDescs.length],
    status, resolution, reviewers[idx % reviewers.length], p.grid_code
  );
});

console.log('✓ 纠纷数据更新完成');

console.log('\n=== 数据统计 ===');
const stats = db.prepare(`
  SELECT 
    (SELECT COUNT(*) FROM providers WHERE review_status = 'approved') as approved,
    (SELECT COUNT(*) FROM providers WHERE review_status = 'pending') as pending,
    (SELECT COUNT(*) FROM providers WHERE review_status = 'expired') as expired,
    (SELECT COUNT(*) FROM settlements WHERE status = 'pending') as pending_settlements,
    (SELECT COUNT(*) FROM disputes WHERE status = 'pending') as pending_disputes
`).get();

console.log(`服务商年审: 已通过${stats.approved}家 | 待审核${stats.pending}家 | 已过期${stats.expired}家`);
console.log(`待结算: ${stats.pending_settlements}笔 | 待处理纠纷: ${stats.pending_disputes}起`);

db.close();
console.log('\n=== 完成 ===');
