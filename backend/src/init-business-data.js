const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

console.log('=== 初始化业务数据 ===\n');

const users = db.prepare('SELECT id, phone, role, name FROM users').all();
const workers = db.prepare('SELECT id, user_id FROM workers').all();
const companies = db.prepare('SELECT id, user_id, company_name FROM companies').all();
const teams = db.prepare('SELECT id, user_id, team_name FROM teams').all();
const jobs = db.prepare('SELECT id, company_id, title, daily_salary, deposit_amount FROM job_posts').all();
const templates = db.prepare('SELECT id FROM contract_templates').all();

const workerMap = {};
workers.forEach(w => workerMap[w.user_id] = w.id);

const companyMap = {};
companies.forEach(c => companyMap[c.user_id] = c.id);

const teamMap = {};
teams.forEach(t => teamMap[t.user_id] = t.id);

const userWorkerIds = users.filter(u => u.role === 'worker').map(u => workerMap[u.id]);
const userCompanyIds = users.filter(u => u.role === 'company').map(u => companyMap[u.id]);
const userTeamIds = users.filter(u => u.role === 'team').map(u => teamMap[u.id]);

const insertMatch = db.prepare(`
  INSERT OR IGNORE INTO job_matches (job_id, worker_id, team_id, match_score, status, 
                                       worker_deposit, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertAttendance = db.prepare(`
  INSERT OR IGNORE INTO attendances (job_match_id, worker_id, check_in_time, check_out_time,
                                     hours_worked, location_verified, confirmed, confirmed_by, 
                                     confirmed_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertPayment = db.prepare(`
  INSERT OR IGNORE INTO payments (job_match_id, amount, type, status, from_user_id, 
                                   to_user_id, released_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertContract = db.prepare(`
  INSERT OR IGNORE INTO contracts (job_match_id, template_id, content, signed_by_worker,
                                   signed_by_company, signed_at, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertDispute = db.prepare(`
  INSERT OR IGNORE INTO labor_disputes (job_match_id, plaintiff_id, defendant_id, type,
                                        description, evidence, status, resolution, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const matchData = [
  { jobIdx: 0, workerIdx: 0, status: 'accepted', deposit: 500, daysAgo: 5, matchScore: 95 },
  { jobIdx: 0, workerIdx: 1, status: 'pending', deposit: 500, daysAgo: 3, matchScore: 88 },
  { jobIdx: 1, teamIdx: 0, status: 'accepted', deposit: 2000, daysAgo: 7, matchScore: 92 },
  { jobIdx: 2, workerIdx: 0, status: 'completed', deposit: 300, daysAgo: 14, matchScore: 90 },
  { jobIdx: 2, workerIdx: 1, status: 'in_progress', deposit: 300, daysAgo: 5, matchScore: 85 },
  { jobIdx: 3, teamIdx: 0, status: 'in_progress', deposit: 1500, daysAgo: 10, matchScore: 87 },
  { jobIdx: 4, workerIdx: 0, status: 'accepted', deposit: 500, daysAgo: 4, matchScore: 93 },
  { jobIdx: 5, workerIdx: 1, status: 'rejected', deposit: 0, daysAgo: 2, matchScore: 75 },
];

const now = new Date();
const createdMatches = [];

matchData.forEach((data, idx) => {
  const job = jobs[data.jobIdx];
  const workerId = data.workerIdx !== undefined ? userWorkerIds[data.workerIdx] : null;
  const teamId = data.teamIdx !== undefined ? userTeamIds[data.teamIdx] : null;
  const createdAt = new Date(now.getTime() - data.daysAgo * 24 * 60 * 60 * 1000);
  
  const result = insertMatch.run(
    job.id, workerId, teamId, data.matchScore, data.status,
    data.deposit, createdAt.toISOString()
  );
  
  if (result.changes > 0) {
    const matchId = result.lastInsertRowid;
    createdMatches.push({ id: matchId, job, workerId, teamId, status: data.status, createdAt });
    console.log(`✅ 创建申请: ${job.title} - ${data.status} (匹配度: ${data.matchScore}%)`);
    
    if (workerId) {
      const workerUser = users.find(u => workerMap[u.id] === workerId);
      console.log(`   ↳ 申请人: ${workerUser?.name || '工友'}`);
    }
    if (teamId) {
      const teamUser = users.find(u => teamMap[u.id] === teamId);
      console.log(`   ↳ 申请班组: ${teamUser?.name || '班组'}`);
    }
  }
});

console.log('\n=== 初始化考勤打卡数据 ===\n');

createdMatches.forEach(match => {
  if (match.status === 'completed' || match.status === 'in_progress') {
    const daysToCreate = match.status === 'completed' ? 10 : 5;
    
    for (let i = 0; i < daysToCreate; i++) {
      const dayOffset = match.status === 'completed' ? (daysToCreate - i) : i;
      const checkIn = new Date(match.createdAt.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      checkIn.setHours(8, 0, 0, 0);
      const checkOut = new Date(checkIn.getTime() + 10 * 60 * 60 * 1000);
      const confirmedAt = new Date(checkOut.getTime() + 30 * 60 * 1000);
      
      const result = insertAttendance.run(
        match.id, match.workerId || userWorkerIds[0],
        checkIn.toISOString(), checkOut.toISOString(),
        10.0, 1, 1, companies[0].user_id,
        confirmedAt.toISOString(), checkIn.toISOString()
      );
      
      if (result.changes > 0 && i === 0) {
        console.log(`✅ 创建考勤: ${match.job.title} - ${daysToCreate}天打卡记录`);
      }
    }
  }
});

console.log('\n=== 初始化支付与保证金数据 ===\n');

createdMatches.forEach(match => {
  if (match.job.deposit_amount > 0 && match.status !== 'rejected') {
    const fromUserId = match.workerId ? users.find(u => workerMap[u.id] === match.workerId)?.id :
                       match.teamId ? users.find(u => teamMap[u.id] === match.teamId)?.id :
                       userWorkerIds[0];
    const toUserId = match.job.company_id;
    
    const paymentTime = new Date(match.createdAt.getTime() + 2 * 60 * 60 * 1000);
    
    const result = insertPayment.run(
      match.id, match.job.deposit_amount, 'deposit',
      match.status === 'completed' ? 'released' : 'held',
      fromUserId, toUserId,
      match.status === 'completed' ? new Date(match.createdAt.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString() : null,
      paymentTime.toISOString()
    );
    
    if (result.changes > 0) {
      console.log(`✅ 保证金: ¥${match.job.deposit_amount} - ${match.job.title}`);
    }
  }
  
  if (match.status === 'completed') {
    const fromUserId = match.job.company_id;
    const toUserId = match.workerId ? users.find(u => workerMap[u.id] === match.workerId)?.id :
                     match.teamId ? users.find(u => teamMap[u.id] === match.teamId)?.id :
                     userWorkerIds[0];
    const totalSalary = match.job.daily_salary * 10;
    const salaryTime = new Date(match.createdAt.getTime() + 11 * 24 * 60 * 60 * 1000);
    
    const result = insertPayment.run(
      match.id, totalSalary, 'salary', 'released',
      fromUserId, toUserId, salaryTime.toISOString(), salaryTime.toISOString()
    );
    
    if (result.changes > 0) {
      console.log(`✅ 工资支付: ¥${totalSalary} - ${match.job.title} (10天)`);
    }
  }
});

console.log('\n=== 初始化合同数据 ===\n');

createdMatches.forEach((match, idx) => {
  if (match.status === 'accepted' || match.status === 'in_progress' || match.status === 'completed') {
    const template = templates[idx % templates.length];
    const workerUserId = match.workerId ? users.find(u => workerMap[u.id] === match.workerId)?.id :
                         match.teamId ? users.find(u => teamMap[u.id] === match.teamId)?.id :
                         userWorkerIds[0];
    
    const contractContent = `
建筑用工劳务合同

甲方（用工方）：${companies.find(c => c.id === match.job.company_id)?.company_name || '企业'}
乙方（劳动者）：${users.find(u => u.id === workerUserId)?.name || '工友'}

一、工程项目：${match.job.title}
二、工作地点：${match.job.location}
三、用工期限：自${match.job.start_date}至${match.job.end_date}
四、劳动报酬：¥${match.job.daily_salary}/天，按实际出勤天数结算
五、工作时间：每日工作10小时，含午餐休息1小时
六、安全责任：甲方提供安全防护用品，乙方必须遵守安全操作规程
七、工资支付：每月15日支付上月工资
八、违约责任：双方严格履行合同，违约方承担相应责任
    `.trim();
    
    const signedAt = new Date(match.createdAt.getTime() + 1 * 24 * 60 * 60 * 1000);
    
    const result = insertContract.run(
      match.id, template.id, contractContent,
      1, 1, signedAt.toISOString(),
      match.status === 'completed' ? 'terminated' : 'signed',
      match.createdAt.toISOString()
    );
    
    if (result.changes > 0) {
      console.log(`✅ 合同已签署: ${match.job.title}`);
    }
  }
});

console.log('\n=== 初始化劳务纠纷数据 ===\n');

const completedMatches = createdMatches.filter(m => m.status === 'completed');
if (completedMatches.length > 0) {
  const disputeMatch = completedMatches[0];
  const plaintiffId = disputeMatch.workerId ? users.find(u => workerMap[u.id] === disputeMatch.workerId)?.id :
                       disputeMatch.teamId ? users.find(u => teamMap[u.id] === disputeMatch.teamId)?.id :
                       userWorkerIds[0];
  const defendantId = disputeMatch.job.company_id;
  
  const result = insertDispute.run(
    disputeMatch.id, plaintiffId, defendantId,
    'wage_dispute',
    '乙方认为甲方少计算了2天加班工资，共计¥840元。甲方表示已按合同约定支付。',
    '考勤记录截图、工资条、合同照片',
    'resolved',
    '经平台调解，甲方同意支付2天加班工资¥840元，乙方表示接受。双方达成和解。',
    new Date(disputeMatch.createdAt.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString()
  );
  
  if (result.changes > 0) {
    console.log(`✅ 纠纷记录: ${disputeMatch.job.title} - 工资争议（已解决）`);
  }
}

const todayAttendanceCount = db.prepare("SELECT COUNT(*) as count FROM attendances WHERE DATE(created_at) = DATE('now')").get().count;
if (todayAttendanceCount === 0) {
  const inProgressMatches = createdMatches.filter(m => m.status === 'in_progress');
  if (inProgressMatches.length > 0) {
    const match = inProgressMatches[0];
    const todayCheckIn = new Date();
    todayCheckIn.setHours(8, 0, 0, 0);
    
    insertAttendance.run(
      match.id, match.workerId || userWorkerIds[0],
      todayCheckIn.toISOString(), null,
      0, 1, 0, null, null,
      todayCheckIn.toISOString()
    );
    console.log(`✅ 今日打卡: ${match.job.title} - 已上班打卡`);
  }
}

console.log('\n=== 数据统计 ===\n');
const stats = {
  matches: db.prepare('SELECT COUNT(*) as count FROM job_matches').get().count,
  attendances: db.prepare('SELECT COUNT(*) as count FROM attendances').get().count,
  payments: db.prepare('SELECT COUNT(*) as count FROM payments').get().count,
  contracts: db.prepare('SELECT COUNT(*) as count FROM contracts').get().count,
  disputes: db.prepare('SELECT COUNT(*) as count FROM labor_disputes').get().count,
  todayAttendance: db.prepare("SELECT COUNT(*) as count FROM attendances WHERE DATE(created_at) = DATE('now')").get().count
};

console.log(`📊 申请记录: ${stats.matches} 条`);
console.log(`📊 打卡记录: ${stats.attendances} 条`);
console.log(`📊 支付记录: ${stats.payments} 条`);
console.log(`📊 合同记录: ${stats.contracts} 份`);
console.log(`📊 纠纷记录: ${stats.disputes} 条`);
console.log(`📊 今日打卡: ${stats.todayAttendance} 人`);

console.log('\n=== 业务数据初始化完成 ===\n');
console.log('🔗 过程保障链路已闭环：');
console.log('   申请 → 保证金托管 → 合同签署 → 考勤打卡 → 工时确认 → 工资支付 → 纠纷调解');

db.close();
