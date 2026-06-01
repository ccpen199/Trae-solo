const express = require('express');
const router = express.Router();
const db = require('../database');
const crypto = require('crypto');

function generateId() {
  return 'APP' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '';
  let params = [];
  
  if (status) {
    whereClause = 'WHERE status = ?';
    params.push(status);
  }
  
  const applications = db.prepare(`
    SELECT * FROM applications 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM applications ${whereClause}`).get(...params);
  
  res.json({
    data: applications,
    total: total.count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/', (req, res) => {
  const { applicant_name, id_card, phone, bank_card, contacts, device_info } = req.body;
  const applicationId = generateId();
  
  const insertApp = db.prepare(`
    INSERT INTO applications (id, applicant_name, id_card, phone, bank_card)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertApp.run(applicationId, applicant_name, id_card, phone, bank_card || null);
  
  if (contacts && contacts.length > 0) {
    const insertContact = db.prepare(`
      INSERT INTO contacts (application_id, name, phone, relationship)
      VALUES (?, ?, ?, ?)
    `);
    contacts.forEach(contact => {
      insertContact.run(applicationId, contact.name, contact.phone, contact.relationship || null);
    });
  }
  
  if (device_info) {
    const insertDevice = db.prepare(`
      INSERT INTO device_fingerprint (application_id, device_id, ip_address, user_agent)
      VALUES (?, ?, ?, ?)
    `);
    insertDevice.run(applicationId, device_info.device_id || 'unknown', device_info.ip_address || null, device_info.user_agent || null);
  }
  
  runVerification(applicationId, id_card, phone, bank_card, device_info);
  
  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId);
  res.status(201).json(application);
});

function runVerification(applicationId, id_card, phone, bank_card, device_info) {
  const insertVerify = db.prepare(`
    INSERT INTO identity_verification (application_id, verify_type, status, source, raw_data)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const idStatus = id_card === '110101199001011234' ? 'fail' : 'pass';
  insertVerify.run(applicationId, 'id_card', idStatus, '身份认证中心', JSON.stringify({ id_card, name_verified: true }));
  
  const phoneStatus = phone === '13800138000' ? 'fail' : 'pass';
  insertVerify.run(applicationId, 'phone', phoneStatus, '运营商数据', JSON.stringify({ phone, real_name: true }));
  
  if (bank_card) {
    insertVerify.run(applicationId, 'bank_card', 'pass', '银行卡验证中心', JSON.stringify({ bank_card, verified: true }));
  }
  
  if (device_info) {
    const deviceStatus = device_info.device_id === 'device_fraud_001' ? 'fail' : 'pass';
    insertVerify.run(applicationId, 'device', deviceStatus, '设备指纹服务', JSON.stringify(device_info));
  }
  
  checkBlacklist(applicationId, id_card, phone, bank_card, device_info);
  calculateRiskScore(applicationId);
}

function checkBlacklist(applicationId, id_card, phone, bank_card, device_info) {
  const insertHit = db.prepare(`
    INSERT INTO blacklist_hits (application_id, blacklist_id, hit_type, hit_value, match_score, confirmed)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const blacklistItems = db.prepare('SELECT * FROM blacklist WHERE status = ?').all('active');
  
  blacklistItems.forEach(item => {
    let isExactMatch = false;
    let isFuzzyMatch = false;
    let hitValue = '';
    
    switch (item.type) {
      case 'id_card':
        if (id_card) {
          if (id_card === item.value) {
            isExactMatch = true;
            hitValue = id_card;
          } else if (item.alias && (item.alias.includes(id_card.slice(0, 6)) || item.alias.includes(id_card.slice(-6)))) {
            isFuzzyMatch = true;
            hitValue = id_card;
          }
        }
        break;
      case 'phone':
        if (phone) {
          if (phone === item.value) {
            isExactMatch = true;
            hitValue = phone;
          } else if (item.alias && (phone.slice(-4) === item.value.slice(-4))) {
            isFuzzyMatch = true;
            hitValue = phone;
          }
        }
        break;
      case 'bank_card':
        if (bank_card && bank_card === item.value) {
          isExactMatch = true;
          hitValue = bank_card;
        }
        break;
      case 'device':
        if (device_info && device_info.device_id === item.value) {
          isExactMatch = true;
          hitValue = device_info.device_id;
        }
        break;
    }
    
    if (isExactMatch || isFuzzyMatch) {
      const matchScore = isExactMatch ? 1.0 : 0.5;
      const confirmed = isExactMatch ? (item.confirmed || 1) : 0;
      insertHit.run(applicationId, item.id, item.type, hitValue, matchScore, confirmed);
    }
  });
}

function calculateRiskScore(applicationId) {
  let totalScore = 100;
  
  const blacklistHits = db.prepare('SELECT * FROM blacklist_hits WHERE application_id = ?').all(applicationId);
  
  const insertRuleHit = db.prepare(`
    INSERT INTO rule_hits (application_id, rule_id, rule_version, hit_value, score_deducted)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const confirmedHits = blacklistHits.filter(hit => hit.confirmed === 1);
  const unconfirmedHits = blacklistHits.filter(hit => hit.confirmed === 0);
  
  if (confirmedHits.length > 0) {
    const rule = db.prepare('SELECT * FROM risk_rules WHERE rule_code = ?').get('BLACKLIST_HIT');
    if (rule) {
      confirmedHits.forEach(hit => {
        totalScore -= rule.score_weight;
        insertRuleHit.run(applicationId, rule.id, rule.rule_version, hit.hit_value, rule.score_weight);
      });
    }
  }
  
  if (unconfirmedHits.length > 0) {
    const rule = db.prepare('SELECT * FROM risk_rules WHERE rule_code = ?').get('BLACKLIST_HIT');
    if (rule) {
      const fuzzyDeduction = Math.floor(rule.score_weight * 0.3);
      unconfirmedHits.forEach(hit => {
        totalScore -= fuzzyDeduction;
        insertRuleHit.run(applicationId, rule.id, rule.rule_version, '疑似匹配-' + hit.hit_value, fuzzyDeduction);
      });
    }
  }
  
  const contacts = db.prepare('SELECT * FROM contacts WHERE application_id = ?').all(applicationId);
  if (contacts.length < 2) {
    const rule = db.prepare('SELECT * FROM risk_rules WHERE rule_code = ?').get('LOW_CONTACT_COMPLETENESS');
    if (rule) {
      totalScore -= rule.score_weight;
      insertRuleHit.run(applicationId, rule.id, rule.rule_version, `联系人数量: ${contacts.length}`, rule.score_weight);
    }
  }
  
  let finalDecision = 'approve';
  if (totalScore < 60) {
    finalDecision = 'reject';
  } else if (totalScore < 80) {
    finalDecision = 'review';
  }
  
  db.prepare('UPDATE applications SET risk_score = ?, final_decision = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(totalScore, finalDecision, finalDecision === 'reject' ? 'rejected' : finalDecision === 'review' ? 'pending_review' : 'approved', applicationId);
}

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  const verifications = db.prepare('SELECT * FROM identity_verification WHERE application_id = ?').all(id);
  const blacklistHits = db.prepare('SELECT bh.*, b.source, b.risk_level, b.alias FROM blacklist_hits bh LEFT JOIN blacklist b ON bh.blacklist_id = b.id WHERE bh.application_id = ?').all(id);
  const contacts = db.prepare('SELECT * FROM contacts WHERE application_id = ?').all(id);
  const devices = db.prepare('SELECT * FROM device_fingerprint WHERE application_id = ?').all(id);
  const ruleHits = db.prepare('SELECT rh.*, rr.rule_name, rr.rule_code FROM rule_hits rh LEFT JOIN risk_rules rr ON rh.rule_id = rr.id WHERE rh.application_id = ?').all(id);
  const reviews = db.prepare('SELECT * FROM review_records WHERE application_id = ? ORDER BY created_at DESC').all(id);
  
  res.json({
    application,
    verifications,
    blacklistHits,
    contacts,
    devices,
    ruleHits,
    reviews
  });
});

router.post('/:id/review', (req, res) => {
  const { id } = req.params;
  const { reviewer_id, decision, note } = req.body;
  
  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  db.prepare(`
    INSERT INTO review_records (application_id, reviewer_id, previous_decision, new_decision, review_note)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, reviewer_id || 'system', application.final_decision, decision, note || null);
  
  const newStatus = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'pending_review';
  db.prepare('UPDATE applications SET final_decision = ?, status = ?, reviewer_id = ?, review_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(decision, newStatus, reviewer_id || 'system', note || null, id);
  
  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  res.json(updated);
});

module.exports = router;
