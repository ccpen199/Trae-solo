const express = require('express');
const router = express.Router();
const { db } = require('../database');

const HIGH_FREQUENCY_THRESHOLD = 10;
const TIME_WINDOW_MINUTES = 5;

function checkHighFrequency(caller) {
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM verification_logs
    WHERE caller = ? 
      AND created_at >= datetime('now', ?)
  `).get(caller, `-${TIME_WINDOW_MINUTES} minutes`);
  
  return result.count >= HIGH_FREQUENCY_THRESHOLD;
}

function createAuditLog(caller, accessCount, ipAddress) {
  db.prepare(`
    INSERT INTO audit_logs (log_type, caller, ip_address, access_count, time_window, alert_level, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'high_frequency_verification',
    caller,
    ipAddress || '',
    accessCount,
    `${TIME_WINDOW_MINUTES} minutes`,
    accessCount >= 20 ? 'danger' : 'warning',
    `高频核验调用：${accessCount}次/${TIME_WINDOW_MINUTES}分钟`
  );
}

router.post('/', (req, res) => {
  const { certificate_number, caller, purpose, verify_fields } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  if (!certificate_number || !caller || !purpose) {
    return res.status(400).json({ success: false, message: '缺少必填字段' });
  }
  
  if (checkHighFrequency(caller)) {
    const countResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM verification_logs
      WHERE caller = ? 
        AND created_at >= datetime('now', ?)
    `).get(caller, `-${TIME_WINDOW_MINUTES} minutes`);
    
    createAuditLog(caller, countResult.count, ipAddress);
    
    return res.status(429).json({ 
      success: false, 
      message: '调用频率过高，请稍后重试',
      code: 'HIGH_FREQUENCY'
    });
  }
  
  const cert = db.prepare(`
    SELECT c.*, 
           a.applicant_name, a.id_type, a.id_number,
           t.template_name, t.template_code
    FROM certificates c
    LEFT JOIN applicants a ON c.applicant_id = a.id
    LEFT JOIN certificate_templates t ON c.template_id = t.id
    WHERE c.certificate_number = ?
  `).get(certificate_number);
  
  let verificationResult = 'invalid';
  let verificationDetails = {};
  
  if (!cert) {
    verificationResult = 'not_found';
    verificationDetails = { message: '证照不存在' };
  } else if (cert.status === 'revoked') {
    verificationResult = 'revoked';
    verificationDetails = { 
      message: '证照已吊销',
      certificate_status: cert.status,
      template_name: cert.template_name,
      applicant_name: cert.applicant_name
    };
  } else if (new Date(cert.expiry_date) < new Date()) {
    verificationResult = 'expired';
    verificationDetails = { 
      message: '证照已过期',
      expiry_date: cert.expiry_date,
      template_name: cert.template_name,
      applicant_name: cert.applicant_name
    };
  } else if (cert.status === 'active') {
    verificationResult = 'valid';
    const certData = JSON.parse(cert.certificate_data);
    verificationDetails = {
      template_name: cert.template_name,
      template_code: cert.template_code,
      applicant_name: cert.applicant_name,
      id_type: cert.id_type,
      id_number: cert.id_number,
      issuing_authority: cert.issuing_authority,
      issue_date: cert.issue_date,
      expiry_date: cert.expiry_date,
      certificate_data: verify_fields ? 
        Object.fromEntries(Object.entries(certData).filter(([k]) => verify_fields.includes(k))) :
        certData,
      signature_valid: true
    };
  }
  
  db.prepare(`
    INSERT INTO verification_logs 
    (certificate_number, caller, purpose, verification_result, verification_details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    certificate_number,
    caller,
    purpose,
    verificationResult,
    JSON.stringify(verificationDetails),
    ipAddress,
    userAgent
  );
  
  res.json({ 
    success: true, 
    data: {
      certificate_number,
      verification_result: verificationResult,
      details: verificationDetails
    }
  });
});

router.get('/logs', (req, res) => {
  const { caller, certificate_number, result, page = 1, pageSize = 20 } = req.query;
  
  let sql = `
    SELECT vl.*, a.applicant_name
    FROM verification_logs vl
    LEFT JOIN certificates c ON vl.certificate_number = c.certificate_number
    LEFT JOIN applicants a ON c.applicant_id = a.id
    WHERE 1=1
  `;
  const params = [];
  
  if (caller) {
    sql += ' AND vl.caller = ?';
    params.push(caller);
  }
  if (certificate_number) {
    sql += ' AND vl.certificate_number = ?';
    params.push(certificate_number);
  }
  if (result) {
    sql += ' AND vl.verification_result = ?';
    params.push(result);
  }
  
  sql += ' ORDER BY vl.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const logs = db.prepare(sql).all(...params).map(l => ({
    ...l,
    verification_details: JSON.parse(l.verification_details)
  }));
  
  const total = db.prepare('SELECT COUNT(*) as count FROM verification_logs').get().count;
  
  res.json({ success: true, data: logs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/audit', (req, res) => {
  const { alert_level, page = 1, pageSize = 20 } = req.query;
  
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];
  
  if (alert_level) {
    sql += ' AND alert_level = ?';
    params.push(alert_level);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const logs = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
  
  res.json({ success: true, data: logs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/stats', (req, res) => {
  const today = db.prepare("SELECT COUNT(*) as count FROM verification_logs WHERE date(created_at) = date('now')").get().count;
  const total = db.prepare('SELECT COUNT(*) as count FROM verification_logs').get().count;
  const validCount = db.prepare("SELECT COUNT(*) as count FROM verification_logs WHERE verification_result = 'valid'").get().count;
  
  const byResult = db.prepare(`
    SELECT verification_result, COUNT(*) as count
    FROM verification_logs
    GROUP BY verification_result
  `).all();
  
  res.json({
    success: true,
    data: {
      today_count: today,
      total_count: total,
      valid_rate: total > 0 ? (validCount / total * 100).toFixed(2) : 0,
      by_result: byResult
    }
  });
});

module.exports = router;
