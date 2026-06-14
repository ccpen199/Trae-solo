const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../data/app.sqlite');
const db = new Database(DB_PATH);

const reviewRecords = [
  {
    job_id: 1,
    review_level: 'site',
    reviewer: '工地管理员-王工长',
    result: 'pass',
    comment: '工地实名核验通过：工人信息与身份证一致',
    review_date: '2024-06-18',
    details: '{"checkItems":["身份证核验","人脸比对","健康码检查"],"verifiedCount":10}'
  },
  {
    job_id: 8,
    review_level: 'site',
    reviewer: '工地管理员-赵工长',
    result: 'pass',
    comment: '工地实名核验通过',
    review_date: '2024-06-18',
    details: '{"verifiedCount":20}'
  },
  {
    job_id: 2,
    review_level: 'site',
    reviewer: '工地管理员-刘工长',
    result: 'pending',
    comment: '等待工地实名核验',
    review_date: '2024-06-17',
    details: '{}'
  },
  {
    job_id: 6,
    review_level: 'ai',
    reviewer: 'AI系统',
    result: 'pass',
    comment: 'AI自动审核通过',
    review_date: '2024-06-17',
    details: '{"score":85}'
  },
  {
    job_id: 7,
    review_level: 'manual',
    reviewer: '住建部门-王审核员',
    result: 'pass',
    comment: '人工复核通过',
    review_date: '2024-06-17',
    details: '{"score":89}'
  },
  {
    job_id: 1,
    review_level: 'manual',
    reviewer: '住建部门-李审核员',
    result: 'pass',
    comment: '人工复核通过：项目真实有效，用工需求合理',
    review_date: '2024-06-16',
    details: '{"checkItems":["企业资质","项目审批文件","工资保证金"],"score":95}'
  },
  {
    job_id: 2,
    review_level: 'manual',
    reviewer: '住建部门-张审核员',
    result: 'pass',
    comment: '人工复核通过',
    review_date: '2024-06-16',
    details: '{"score":90}'
  },
  {
    job_id: 7,
    review_level: 'ai',
    reviewer: 'AI系统',
    result: 'pass',
    comment: 'AI自动审核通过',
    review_date: '2024-06-16',
    details: '{"score":91}'
  },
  {
    job_id: 8,
    review_level: 'manual',
    reviewer: '住建部门-李审核员',
    result: 'pass',
    comment: '人工复核通过',
    review_date: '2024-06-16',
    details: '{"score":93}'
  },
  {
    job_id: 1,
    review_level: 'ai',
    reviewer: 'AI系统',
    result: 'pass',
    comment: 'AI自动审核通过：信息完整、资质符合要求',
    review_date: '2024-06-15',
    details: '{"checkItems":["资质验证","信息完整性","风险评估"],"score":92}'
  },
  {
    job_id: 2,
    review_level: 'ai',
    reviewer: 'AI系统',
    result: 'pass',
    comment: 'AI自动审核通过',
    review_date: '2024-06-15',
    details: '{"score":88}'
  },
  {
    job_id: 8,
    review_level: 'ai',
    reviewer: 'AI系统',
    result: 'pass',
    comment: 'AI自动审核通过',
    review_date: '2024-06-15',
    details: '{"score":87}'
  }
];

const insertStmt = db.prepare(`
  INSERT INTO review_records (job_id, review_level, reviewer, result, comment, review_date, details)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const transaction = db.transaction(() => {
  for (const record of reviewRecords) {
    insertStmt.run(
      record.job_id,
      record.review_level,
      record.reviewer,
      record.result,
      record.comment,
      record.review_date,
      record.details
    );
  }
});

console.log('Seeding review records...');
transaction();

const count = db.prepare('SELECT COUNT(*) as count FROM review_records').get();
console.log(`✓ Successfully inserted ${reviewRecords.length} review records. Total now: ${count.count}`);

const sample = db.prepare('SELECT * FROM review_records ORDER BY review_date DESC LIMIT 3').all();
console.log('\nSample records:');
console.log(JSON.stringify(sample, null, 2));

db.close();
