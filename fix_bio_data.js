const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'backend/data/app.sqlite'));

function generateCertificateNo() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `DEL-${dateStr}-${random}`;
}

function generateDestructionHash() {
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

const deletionMethods = ['physical', 'logical', 'crypto_destroy'];
const reviewOpinions = [
  '符合《建筑业用工实名制管理办法》第十一条、第二十八条规定，数据已彻底物理销毁，可追溯审计',
  '符合《建筑业用工实名制管理办法》第十一条、第二十八条规定，数据已逻辑删除并隔离，可追溯审计',
  '符合《建筑业用工实名制管理办法》第十一条、第二十八条规定，数据已加密销毁，密钥已废止，可追溯审计'
];

const bioLogs = db.prepare(`
  SELECT id, worker_id, audit_trail 
  FROM biometric_deletion_logs
`).all();

console.log(`找到 ${bioLogs.length} 条生物特征删除记录`);

const updateStmt = db.prepare(`
  UPDATE biometric_deletion_logs 
  SET deletion_certificate_no = ?, deletion_method = ?, deletion_result = ?,
      review_opinion = ?, execution_time = ?, destruction_hash = ?,
      audit_trail = ?
  WHERE id = ?
`);

for (let i = 0; i < bioLogs.length; i++) {
  const log = bioLogs[i];
  const certificateNo = generateCertificateNo();
  const destructionHash = generateDestructionHash();
  const executionTime = new Date().toISOString();
  const method = deletionMethods[i % deletionMethods.length];
  const opinion = reviewOpinions[i % reviewOpinions.length];
  
  let auditTrail = {};
  try {
    auditTrail = JSON.parse(log.audit_trail || '{}');
  } catch(e) {}
  
  const newAuditTrail = JSON.stringify({
    ...auditTrail,
    operator: 1,
    operatorName: 'admin',
    operatorRole: 'admin',
    timestamp: executionTime,
    ipAddress: '127.0.0.1',
    certificateNo: certificateNo,
    destructionHash: destructionHash,
    deletionMethod: method
  });
  
  const info = updateStmt.run(
    certificateNo, method, 'success',
    opinion, executionTime, destructionHash,
    newAuditTrail,
    log.id
  );
  
  console.log(`更新记录 ${log.id}: ${certificateNo}, method=${method}`);
}

console.log(`\n共更新 ${bioLogs.length} 条记录`);
db.close();
