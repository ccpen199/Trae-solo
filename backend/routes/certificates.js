const express = require('express');
const router = express.Router();
const { db } = require('../database');
const crypto = require('crypto');

function generateCertificateNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EC${year}${random}${Date.now().toString(36).substring(-4).toUpperCase()}`;
}

function calculateExpiryDate(validityPeriod, validityUnit) {
  const now = new Date();
  switch (validityUnit) {
    case 'year':
      now.setFullYear(now.getFullYear() + validityPeriod);
      break;
    case 'month':
      now.setMonth(now.getMonth() + validityPeriod);
      break;
    case 'day':
    default:
      now.setDate(now.getDate() + validityPeriod);
      break;
  }
  return now.toISOString();
}

router.get('/', (req, res) => {
  const { status, applicant_id, template_id } = req.query;
  let sql = `
    SELECT c.*, 
           a.applicant_name, a.id_type, a.id_number,
           t.template_name, t.template_code
    FROM certificates c
    LEFT JOIN applicants a ON c.applicant_id = a.id
    LEFT JOIN certificate_templates t ON c.template_id = t.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }
  if (applicant_id) {
    sql += ' AND c.applicant_id = ?';
    params.push(applicant_id);
  }
  if (template_id) {
    sql += ' AND c.template_id = ?';
    params.push(template_id);
  }
  sql += ' ORDER BY c.created_at DESC';
  
  const certificates = db.prepare(sql).all(...params).map(c => ({
    ...c,
    certificate_data: JSON.parse(c.certificate_data)
  }));
  
  res.json({ success: true, data: certificates });
});

router.get('/:id', (req, res) => {
  const cert = db.prepare(`
    SELECT c.*, 
           a.applicant_name, a.id_type, a.id_number, a.phone, a.email, a.address,
           t.template_name, t.template_code, t.fields as template_fields
    FROM certificates c
    LEFT JOIN applicants a ON c.applicant_id = a.id
    LEFT JOIN certificate_templates t ON c.template_id = t.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  if (!cert) {
    return res.status(404).json({ success: false, message: '证照不存在' });
  }
  
  cert.certificate_data = JSON.parse(cert.certificate_data);
  cert.template_fields = JSON.parse(cert.template_fields);
  
  res.json({ success: true, data: cert });
});

router.get('/number/:certNumber', (req, res) => {
  const cert = db.prepare(`
    SELECT c.*, 
           a.applicant_name, a.id_type, a.id_number,
           t.template_name, t.template_code
    FROM certificates c
    LEFT JOIN applicants a ON c.applicant_id = a.id
    LEFT JOIN certificate_templates t ON c.template_id = t.id
    WHERE c.certificate_number = ?
  `).get(req.params.certNumber);
  
  if (!cert) {
    return res.status(404).json({ success: false, message: '证照不存在' });
  }
  
  cert.certificate_data = JSON.parse(cert.certificate_data);
  res.json({ success: true, data: cert });
});

router.get('/:id/history', (req, res) => {
  const history = db.prepare('SELECT * FROM certificate_history WHERE certificate_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ success: true, data: history });
});

router.post('/', (req, res) => {
  const { template_id, approval_item_id, applicant_id, applicant_info, certificate_data, issuing_authority, issuer } = req.body;
  
  if (!template_id || !applicant_id || !certificate_data || !issuing_authority || !issuer) {
    return res.status(400).json({ success: false, message: '缺少必填字段' });
  }
  
  const template = db.prepare('SELECT * FROM certificate_templates WHERE id = ?').get(template_id);
  if (!template || template.status !== 'active') {
    return res.status(400).json({ success: false, message: '模板不存在或未启用' });
  }
  
  if (approval_item_id) {
    const approval = db.prepare('SELECT * FROM approval_items WHERE id = ?').get(approval_item_id);
    if (!approval || approval.status !== 'approved') {
      return res.status(400).json({ success: false, message: '审批未完成，无法签发' });
    }
  }
  
  let applicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(applicant_id);
  if (!applicant && applicant_info) {
    const info = db.prepare('INSERT INTO applicants (applicant_name, id_type, id_number, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)').run(
      applicant_info.applicant_name,
      applicant_info.id_type,
      applicant_info.id_number,
      applicant_info.phone,
      applicant_info.email,
      applicant_info.address
    );
    applicant = { id: info.lastInsertRowid };
  }
  
  const existingCert = db.prepare(`
    SELECT c.id FROM certificates c
    WHERE c.template_id = ? 
      AND c.applicant_id = ? 
      AND c.status = 'active'
  `).get(template_id, applicant.id);
  
  if (existingCert) {
    return res.status(400).json({ success: false, message: '该申请人已持有有效同类证照，请勿重复签发' });
  }
  
  const certificateNumber = generateCertificateNumber();
  const expiryDate = calculateExpiryDate(template.validity_period, template.validity_unit);
  const signature = crypto.createHash('sha256').update(`${certificateNumber}${JSON.stringify(certificate_data)}${Date.now()}`).digest('hex');
  
  try {
    const info = db.prepare(`
      INSERT INTO certificates 
      (certificate_number, template_id, template_version, approval_item_id, applicant_id, issuing_authority, issuer, expiry_date, certificate_data, signature)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      certificateNumber,
      template_id,
      template.version,
      approval_item_id || null,
      applicant.id,
      issuing_authority,
      issuer,
      expiryDate,
      JSON.stringify(certificate_data),
      signature
    );
    
    res.json({ success: true, data: { id: info.lastInsertRowid, certificate_number: certificateNumber } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/extend', (req, res) => {
  const { extend_days, change_reason, legal_basis, operator } = req.body;
  const certId = req.params.id;
  
  if (!extend_days || !change_reason || !operator) {
    return res.status(400).json({ success: false, message: '缺少必填字段' });
  }
  
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);
  if (!cert) {
    return res.status(404).json({ success: false, message: '证照不存在' });
  }
  if (cert.status !== 'active') {
    return res.status(400).json({ success: false, message: '仅有效证照可延期' });
  }
  
  const oldExpiry = new Date(cert.expiry_date);
  const newExpiry = new Date(oldExpiry);
  newExpiry.setDate(newExpiry.getDate() + parseInt(extend_days));
  
  try {
    db.prepare('INSERT INTO certificate_history (certificate_id, operation_type, change_reason, legal_basis, operator, old_status, new_status, old_expiry_date, new_expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      certId,
      'extend',
      change_reason,
      legal_basis || '',
      operator,
      cert.status,
      cert.status,
      cert.expiry_date,
      newExpiry.toISOString()
    );
    
    db.prepare('UPDATE certificates SET expiry_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newExpiry.toISOString(), certId);
    
    res.json({ success: true, message: '延期成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/revoke', (req, res) => {
  const { change_reason, legal_basis, operator } = req.body;
  const certId = req.params.id;
  
  if (!change_reason || !operator) {
    return res.status(400).json({ success: false, message: '缺少必填字段' });
  }
  
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);
  if (!cert) {
    return res.status(404).json({ success: false, message: '证照不存在' });
  }
  if (cert.status === 'revoked') {
    return res.status(400).json({ success: false, message: '证照已吊销' });
  }
  
  try {
    db.prepare('INSERT INTO certificate_history (certificate_id, operation_type, change_reason, legal_basis, operator, old_status, new_status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      certId,
      'revoke',
      change_reason,
      legal_basis || '',
      operator,
      cert.status,
      'revoked'
    );
    
    db.prepare('UPDATE certificates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('revoked', certId);
    
    res.json({ success: true, message: '吊销成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/change', (req, res) => {
  const { certificate_data, change_reason, legal_basis, operator } = req.body;
  const certId = req.params.id;
  
  if (!certificate_data || !change_reason || !operator) {
    return res.status(400).json({ success: false, message: '缺少必填字段' });
  }
  
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);
  if (!cert) {
    return res.status(404).json({ success: false, message: '证照不存在' });
  }
  if (cert.status !== 'active') {
    return res.status(400).json({ success: false, message: '仅有效证照可变更' });
  }
  
  try {
    db.prepare('INSERT INTO certificate_history (certificate_id, operation_type, change_reason, legal_basis, operator, old_data, new_data) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      certId,
      'change',
      change_reason,
      legal_basis || '',
      operator,
      cert.certificate_data,
      JSON.stringify(certificate_data)
    );
    
    db.prepare('UPDATE certificates SET certificate_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(JSON.stringify(certificate_data), certId);
    
    res.json({ success: true, message: '变更成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
