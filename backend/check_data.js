const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '..', 'data', 'app.sqlite');
console.log('数据库路径:', DB_PATH);

const db = new Database(DB_PATH);

console.log('\n=== 检查数据库表 ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('表列表:', tables.map(t => t.name));

console.log('\n=== 各表记录数 ===');
const jobCount = db.prepare('SELECT COUNT(*) as count FROM job_requirements').get();
console.log('job_requirements:', jobCount.count);

const reviewCount = db.prepare('SELECT COUNT(*) as count FROM review_records').get();
console.log('review_records:', reviewCount.count);

const contractCount = db.prepare('SELECT COUNT(*) as count FROM contracts').get();
console.log('contracts:', contractCount.count);

const paymentCount = db.prepare('SELECT COUNT(*) as count FROM wage_payments').get();
console.log('wage_payments:', paymentCount.count);

const workerCount = db.prepare('SELECT COUNT(*) as count FROM workers').get();
console.log('workers:', workerCount.count);

if (jobCount.count > 0) {
  console.log('\n=== Job 时间线 ===');
  const jobs = db.prepare(`
    SELECT id, created_at, updated_at, start_date, end_date, status 
    FROM job_requirements 
    ORDER BY id
  `).all();

  jobs.forEach(job => {
    console.log(`\nJob ${job.id} (${job.status}):`);
    console.log(`  创建时间: ${job.created_at}`);
    console.log(`  更新时间: ${job.updated_at}`);
    console.log(`  开始日期: ${job.start_date}`);
    console.log(`  结束日期: ${job.end_date}`);

    const reviews = db.prepare(`
      SELECT review_level, review_date, result 
      FROM review_records 
      WHERE job_id = ? 
      ORDER BY review_date
    `).all(job.id);

    if (reviews.length > 0) {
      console.log(`  审核记录:`);
      reviews.forEach(r => {
        console.log(`    ${r.review_level}: ${r.review_date} (${r.result})`);
      });
    }

    const contract = db.prepare(`
      SELECT id, worker_signed_at, employer_signed_at, signed_at 
      FROM contracts 
      WHERE job_id = ?
    `).get(job.id);

    if (contract) {
      console.log(`  合同签署:`);
      if (contract.worker_signed_at) console.log(`    工人签署: ${contract.worker_signed_at}`);
      if (contract.employer_signed_at) console.log(`    雇主签署: ${contract.employer_signed_at}`);
      if (contract.signed_at) console.log(`    完成签署: ${contract.signed_at}`);

      const payments = db.prepare(`
        SELECT id, payment_date, amount, status 
        FROM wage_payments 
        WHERE contract_id = ?
        ORDER BY payment_date
      `).all(contract.id);

      if (payments.length > 0) {
        console.log(`  工资支付:`);
        payments.forEach(p => {
          console.log(`    ${p.payment_date}: ¥${p.amount} (${p.status})`);
        });
      }
    }
  });

  console.log('\n=== 时间顺序验证 ===');
  let allValid = true;
  
  jobs.forEach(job => {
    const reviews = db.prepare(`
      SELECT review_level, review_date 
      FROM review_records 
      WHERE job_id = ? 
      ORDER BY review_date
    `).all(job.id);

    const contract = db.prepare(`
      SELECT signed_at 
      FROM contracts 
      WHERE job_id = ?
    `).get(job.id);

    const timeline = [];
    timeline.push({ name: '创建时间', date: job.created_at });
    
    reviews.forEach(r => {
      const levelName = r.review_level === 'ai' ? 'AI审核' : 
                        r.review_level === 'manual' ? '人工审核' : '工地核验';
      timeline.push({ name: levelName, date: r.review_date });
    });

    if (contract && contract.signed_at) {
      timeline.push({ name: '合同签署', date: contract.signed_at });
    }

    for (let i = 1; i < timeline.length; i++) {
      const prev = new Date(timeline[i - 1].date);
      const curr = new Date(timeline[i].date);
      if (curr <= prev) {
        console.log(`❌ Job ${job.id}: ${timeline[i - 1].name} (${timeline[i - 1].date}) >= ${timeline[i].name} (${timeline[i].date})`);
        allValid = false;
      }
    }
  });

  if (allValid) {
    console.log('✅ 所有时间顺序验证通过！');
  }

  console.log('\n=== 年份验证 ===');
  const all2026 = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM job_requirements WHERE substr(created_at, 1, 4) != '2026') as jobs_not_2026,
      (SELECT COUNT(*) FROM review_records WHERE substr(review_date, 1, 4) != '2026') as reviews_not_2026,
      (SELECT COUNT(*) FROM contracts WHERE substr(start_date, 1, 4) != '2026') as contracts_not_2026,
      (SELECT COUNT(*) FROM wage_payments WHERE substr(payment_date, 1, 4) != '2026') as payments_not_2026
  `).get();

  let yearValid = true;
  Object.keys(all2026).forEach(key => {
    if (all2026[key] > 0) {
      console.log(`❌ ${key}: ${all2026[key]} 条记录不在2026年`);
      yearValid = false;
    }
  });

  if (yearValid) {
    console.log('✅ 所有记录都在2026年！');
  }
}

db.close();
console.log('\n完成');
