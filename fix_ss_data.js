const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'backend/data/app.sqlite'));

const today = new Date();
const disposalStatuses = ['pending', 'notified', 'deadline_set', 'reported', 'completed'];
const disposalActions = [null, 'notify_enterprise', 'set_deadline', 'report_regulator', 'completed'];
const disposalResults = [null, '企业已补缴', '已上报监管部门', '已完成处置', '无需处理'];

const unpaidRecords = db.prepare(`
  SELECT id, worker_id, insurance_month, payment_status 
  FROM social_security_records 
  WHERE payment_status IN ('unpaid', 'overdue')
`).all();

console.log(`找到 ${unpaidRecords.length} 条未缴纳/逾期记录`);

const updateStmt = db.prepare(`
  UPDATE social_security_records 
  SET base_amount = ?, personal_amount = ?, enterprise_amount = ?,
      payment_due_date = ?, disposal_status = ?, disposal_action = ?,
      remedial_deadline = ?, is_reported = ?, reported_at = ?,
      reviewed_by = ?, disposal_result = ?, disposal_note = ?
  WHERE id = ?
`);

for (let i = 0; i < unpaidRecords.length; i++) {
  const rec = unpaidRecords[i];
  const baseAmount = 4000 + Math.floor(Math.random() * 4000);
  const personalAmount = Math.round(baseAmount * 0.08);
  const enterpriseAmount = Math.round(baseAmount * 0.16);
  
  const dueDates = ['2026-03-25', '2026-05-25', '2026-04-25', '2026-02-25', '2026-06-25'];
  const paymentDueDate = dueDates[i % dueDates.length];
  
  const dsIndex = i % 5;
  let disposalStatus = disposalStatuses[dsIndex];
  let disposalAction = disposalActions[dsIndex];
  let disposalResult = disposalResults[dsIndex];
  let remedialDeadline = null;
  let isReported = 0;
  let reportedAt = null;
  let reviewedBy = null;
  let disposalNote = null;
  
  if (disposalStatus === 'deadline_set') {
    const rd = new Date(today);
    rd.setDate(rd.getDate() + 15);
    remedialDeadline = rd.toISOString().split('T')[0];
  }
  if (disposalStatus === 'reported') {
    isReported = 1;
    reportedAt = new Date(today.getTime() - 86400000 * 2).toISOString();
    reviewedBy = 1;
    disposalNote = '逾期超过3个月，已上报当地住建部门';
  }
  if (disposalStatus === 'notified') {
    disposalNote = '已电话通知企业HR，3日内回复补缴计划';
  }
  if (disposalStatus === 'completed') {
    reviewedBy = 1;
    disposalNote = '企业已完成补缴，处置完毕';
  }
  
  const info = updateStmt.run(
    baseAmount, personalAmount, enterpriseAmount,
    paymentDueDate, disposalStatus, disposalAction,
    remedialDeadline, isReported, reportedAt,
    reviewedBy, disposalResult, disposalNote,
    rec.id
  );
  
  console.log(`更新记录 ${rec.id}: status=${disposalStatus}, due=${paymentDueDate}, reported=${isReported}`);
}

console.log(`\n共更新 ${unpaidRecords.length} 条记录`);
db.close();
