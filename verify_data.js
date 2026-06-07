const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'data', 'app.sqlite');
const db = new Database(dbPath);

console.log('=== 数据验证 ===\n');

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
console.log('用户总数:', userCount);

const workerCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('worker').count;
console.log('工人用户数:', workerCount);

const projectCount = db.prepare('SELECT COUNT(*) as count FROM construction_projects').get().count;
console.log('项目数:', projectCount);

const certCount = db.prepare('SELECT COUNT(*) as count FROM trade_certifications').get().count;
console.log('认证记录数:', certCount);

const contractCount = db.prepare('SELECT COUNT(*) as count FROM labor_contracts').get().count;
console.log('合同数:', contractCount);

const attendanceCount = db.prepare('SELECT COUNT(*) as count FROM attendance_records').get().count;
console.log('考勤记录数:', attendanceCount);

const payrollCount = db.prepare('SELECT COUNT(*) as count FROM payrolls').get().count;
console.log('工资条数:', payrollCount);

const ssCount = db.prepare('SELECT COUNT(*) as count FROM social_security_records').get().count;
console.log('社保记录数:', ssCount);

const auditCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
console.log('审计日志数:', auditCount);

const bioDeleteCount = db.prepare('SELECT COUNT(*) as count FROM biometric_deletion_logs').get().count;
console.log('生物特征删除日志数:', bioDeleteCount);

console.log('\n=== 样例数据 ===');

const sampleWorkers = db.prepare('SELECT username, real_name, role, status FROM users WHERE role = ? LIMIT 3').all('worker');
console.log('\n工人样例:');
sampleWorkers.forEach(w => console.log(`  ${w.username} (${w.real_name}) - ${w.status}`));

const sampleProjects = db.prepare('SELECT project_name, status, project_code FROM construction_projects LIMIT 3').all();
console.log('\n项目样例:');
sampleProjects.forEach(p => console.log(`  ${p.project_name} (${p.project_code}) - ${p.status}`));

const sampleCerts = db.prepare(`
  SELECT tc.certificate_type, tc.verification_status, u.username 
  FROM trade_certifications tc 
  JOIN users u ON tc.worker_id = u.id 
  LIMIT 3
`).all();
console.log('\n认证样例:');
sampleCerts.forEach(c => console.log(`  ${c.username} - ${c.certificate_type} - ${c.verification_status}`));

const sampleAttendance = db.prepare(`
  SELECT u.username, ar.check_in_time, ar.work_hours, ar.status 
  FROM attendance_records ar 
  JOIN users u ON ar.worker_id = u.id 
  LIMIT 3
`).all();
console.log('\n考勤样例:');
sampleAttendance.forEach(a => console.log(`  ${a.username} - ${a.check_in_time.substring(0, 10)} - ${a.work_hours}小时 - ${a.status}`));

const samplePayroll = db.prepare(`
  SELECT u.username, p.period_year, p.period_month, p.net_salary, p.bank_transfer_status 
  FROM payrolls p 
  JOIN users u ON p.worker_id = u.id 
  LIMIT 3
`).all();
console.log('\n工资条样例:');
samplePayroll.forEach(p => console.log(`  ${p.username} ${p.period_year}-${p.period_month} - ¥${p.net_salary} - ${p.bank_transfer_status}`));

const sampleSS = db.prepare(`
  SELECT u.username, ssr.insurance_month, ssr.payment_amount, ssr.payment_status 
  FROM social_security_records ssr 
  JOIN users u ON ssr.worker_id = u.id 
  LIMIT 3
`).all();
console.log('\n社保样例:');
sampleSS.forEach(s => console.log(`  ${s.username} ${s.insurance_month} - ¥${s.payment_amount} - ${s.payment_status}`));

console.log('\n=== 错误返回格式验证 ===');
console.log('\n验证控制器文件中是否还存在 error: 字段...');

const fs = require('fs');
const controllersPath = path.join(__dirname, 'backend', 'src', 'controllers');
const controllerFiles = [
  'adminController.ts',
  'certificationController.ts', 
  'skillController.ts',
  'jobController.ts',
  'projectController.ts',
  'contractController.ts',
  'attendanceController.ts',
  'payrollController.ts'
];

let hasError = false;
controllerFiles.forEach(file => {
  const content = fs.readFileSync(path.join(controllersPath, file), 'utf8');
  const errorMatches = content.match(/error:/g);
  if (errorMatches) {
    console.log(`  ${file}: 还存在 ${errorMatches.length} 处 error: 字段`);
    hasError = true;
  }
});

if (!hasError) {
  console.log('  ✓ 所有控制器文件的错误返回格式已修复（error: 已替换为 message:）');
}

console.log('\n验证完成！');
db.close();
