const Database = require('better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');

const PROJECT_DIR = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(PROJECT_DIR, '.env') });

const DB_PATH = path.resolve(PROJECT_DIR, 'data', 'app.sqlite');

console.log('数据库路径:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const jobTimeData = {
  1: {
    createdAt: '2026-05-20 09:30:00',
    updatedAt: '2026-05-25 14:00:00',
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    aiReview: '2026-05-21 10:00:00',
    manualReview: '2026-05-22 15:30:00',
    siteReview: '2026-05-23 09:00:00',
    workerSignedAt: '2026-05-25 10:00:00',
    employerSignedAt: null
  },
  2: {
    createdAt: '2026-05-22 14:20:00',
    updatedAt: '2026-05-25 11:00:00',
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    aiReview: '2026-05-23 09:15:00',
    manualReview: '2026-05-24 14:00:00',
    siteReview: '2026-05-25 16:30:00',
    workerSignedAt: '2026-05-27 09:30:00',
    employerSignedAt: '2026-05-27 14:00:00'
  },
  3: {
    createdAt: '2026-06-05 16:00:00',
    updatedAt: '2026-06-05 16:00:00',
    startDate: '2026-07-15',
    endDate: '2027-03-31'
  },
  4: {
    createdAt: '2026-05-25 10:45:00',
    updatedAt: '2026-05-30 09:00:00',
    startDate: '2026-07-10',
    endDate: '2027-03-31',
    aiReview: '2026-05-26 08:30:00',
    manualReview: '2026-05-27 10:00:00',
    siteReview: '2026-05-28 15:00:00',
    workerSignedAt: null,
    employerSignedAt: '2026-05-30 11:00:00'
  },
  5: {
    createdAt: '2026-05-28 11:30:00',
    updatedAt: '2026-06-02 16:00:00',
    startDate: '2026-08-01',
    endDate: '2027-06-30',
    aiReview: '2026-05-29 09:00:00',
    manualReview: '2026-05-30 14:30:00',
    siteReview: '2026-05-31 10:00:00'
  },
  6: {
    createdAt: '2026-06-02 14:00:00',
    updatedAt: '2026-06-03 10:30:00',
    startDate: '2026-08-01',
    endDate: '2027-06-30',
    aiReview: '2026-06-03 09:15:00'
  },
  7: {
    createdAt: '2026-05-30 15:00:00',
    updatedAt: '2026-06-01 11:00:00',
    startDate: '2026-07-20',
    endDate: '2027-05-31',
    aiReview: '2026-05-31 10:00:00',
    manualReview: '2026-06-01 09:30:00'
  },
  8: {
    createdAt: '2026-05-20 08:45:00',
    updatedAt: '2026-05-25 10:00:00',
    startDate: '2026-08-15',
    endDate: '2027-04-30',
    aiReview: '2026-05-21 14:00:00',
    manualReview: '2026-05-22 11:30:00',
    siteReview: '2026-05-23 15:00:00',
    workerSignedAt: null,
    employerSignedAt: null
  }
};

const paymentDates = [
  '2026-06-01 10:30:00',
  '2026-06-03 14:20:00',
  '2026-06-05 09:15:00',
  '2026-06-02 16:45:00',
  '2026-06-04 11:00:00'
];

try {
  db.transaction(() => {
    console.log('开始更新 job_requirements 表...');
    
    Object.keys(jobTimeData).forEach(jobId => {
      const data = jobTimeData[jobId];
      const updateJob = db.prepare(`
        UPDATE job_requirements 
        SET created_at = ?, updated_at = ?, start_date = ?, end_date = ?, verified_at = ?
        WHERE id = ?
      `);
      updateJob.run(
        data.createdAt, 
        data.updatedAt, 
        data.startDate, 
        data.endDate, 
        data.siteReview || null,
        parseInt(jobId)
      );
      console.log(`  Job ${jobId} 时间已更新`);
    });

    console.log('开始更新 review_records 表...');
    
    const reviewRecords = db.prepare('SELECT * FROM review_records ORDER BY id').all();
    
    reviewRecords.forEach(record => {
      const jobData = jobTimeData[record.job_id];
      if (!jobData) return;

      let reviewDate = null;
      if (record.review_level === 'ai' && jobData.aiReview) {
        reviewDate = jobData.aiReview;
      } else if (record.review_level === 'manual' && jobData.manualReview) {
        reviewDate = jobData.manualReview;
      } else if (record.review_level === 'site' && jobData.siteReview) {
        reviewDate = jobData.siteReview;
      }

      if (reviewDate) {
        const updateReview = db.prepare(`
          UPDATE review_records 
          SET review_date = ?, created_at = ?
          WHERE id = ?
        `);
        updateReview.run(reviewDate, reviewDate, record.id);
        console.log(`  Review ${record.id} (Job ${record.job_id}, ${record.review_level}) 时间已更新: ${reviewDate}`);
      }
    });

    console.log('开始更新 contracts 表...');
    
    const contracts = db.prepare('SELECT * FROM contracts ORDER BY id').all();
    
    contracts.forEach(contract => {
      const jobData = jobTimeData[contract.job_id];
      if (!jobData) return;

      const workerSignedAt = jobData.workerSignedAt;
      const employerSignedAt = jobData.employerSignedAt;
      
      let signedAt = null;
      if (workerSignedAt && employerSignedAt) {
        signedAt = new Date(Math.max(new Date(workerSignedAt), new Date(employerSignedAt))).toISOString().slice(0, 19).replace('T', ' ');
      } else if (workerSignedAt) {
        signedAt = workerSignedAt;
      } else if (employerSignedAt) {
        signedAt = employerSignedAt;
      }

      const updateContract = db.prepare(`
        UPDATE contracts 
        SET start_date = ?, end_date = ?, signed_at = ?, 
            worker_signed_at = ?, employer_signed_at = ?, created_at = ?
        WHERE id = ?
      `);
      updateContract.run(
        jobData.startDate,
        jobData.endDate,
        signedAt,
        workerSignedAt,
        employerSignedAt,
        signedAt || jobData.createdAt,
        contract.id
      );
      console.log(`  Contract ${contract.id} (Job ${contract.job_id}) 时间已更新`);
    });

    console.log('开始更新 wage_payments 表...');
    
    const payments = db.prepare('SELECT * FROM wage_payments ORDER BY id').all();
    
    payments.forEach((payment, index) => {
      const paymentDate = paymentDates[index % paymentDates.length];
      const updatePayment = db.prepare(`
        UPDATE wage_payments 
        SET payment_date = ?, created_at = ?
        WHERE id = ?
      `);
      updatePayment.run(paymentDate, paymentDate, payment.id);
      console.log(`  Payment ${payment.id} 时间已更新: ${paymentDate}`);
    });

    console.log('开始更新工人相关日期字段...');
    
    const healthCodeDates = [
      '2026-06-05 08:30:00',
      '2026-06-04 14:20:00',
      '2026-06-05 09:15:00',
      '2026-06-03 16:45:00',
      '2026-06-05 07:50:00',
      '2026-06-05 10:30:00',
      '2026-06-04 11:20:00',
      '2026-06-05 08:00:00'
    ];

    const workers = db.prepare('SELECT * FROM workers ORDER BY id').all();
    workers.forEach((worker, index) => {
      const updateWorker = db.prepare(`
        UPDATE workers 
        SET health_code_updated_at = ?, created_at = ?, updated_at = ?
        WHERE id = ?
      `);
      updateWorker.run(
        healthCodeDates[index % healthCodeDates.length],
        '2026-05-15 10:00:00',
        '2026-06-05 12:00:00',
        worker.id
      );
    });

    const performanceReviewDates = ['2026-04-15', '2026-05-10'];
    const trainingDates = ['2026-04-10', '2026-05-05'];
    
    const perfReviews = db.prepare('SELECT * FROM performance_reviews ORDER BY id').all();
    perfReviews.forEach((review, index) => {
      const updateReview = db.prepare(`
        UPDATE performance_reviews 
        SET review_date = ?, created_at = ?
        WHERE id = ?
      `);
      const reviewDate = performanceReviewDates[index % performanceReviewDates.length];
      updateReview.run(reviewDate, reviewDate + ' 10:00:00', review.id);
    });

    const trainings = db.prepare('SELECT * FROM safety_trainings ORDER BY id').all();
    trainings.forEach((training, index) => {
      const updateTraining = db.prepare(`
        UPDATE safety_trainings 
        SET training_date = ?, created_at = ?
        WHERE id = ?
      `);
      const trainingDate = trainingDates[index % trainingDates.length];
      updateTraining.run(trainingDate, trainingDate + ' 09:00:00', training.id);
    });

    const certificates = db.prepare('SELECT * FROM skill_certificates ORDER BY id').all();
    certificates.forEach(cert => {
      const updateCert = db.prepare(`
        UPDATE skill_certificates 
        SET issue_date = ?, expiry_date = ?, created_at = ?
        WHERE id = ?
      `);
      updateCert.run('2023-06-01', '2028-06-01', '2026-05-15 11:00:00', cert.id);
    });

    console.log('所有数据更新完成！');

  })();

  console.log('\n=== 验证更新结果 ===\n');

  const jobs = db.prepare(`
    SELECT id, created_at, updated_at, start_date, end_date, status 
    FROM job_requirements 
    ORDER BY id
  `).all();

  console.log('=== Job 时间线 ===');
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

} catch (error) {
  console.error('更新失败:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  db.close();
  console.log('\n数据库连接已关闭');
}
