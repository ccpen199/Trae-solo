const express = require('express');
const router = express.Router();
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

router.get('/enterprise', authMiddleware, (req, res) => {
  const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = userStmt.get(req.userId);

  const entStmt = db.prepare('SELECT * FROM enterprise_info WHERE user_id = ?');
  let enterprise = entStmt.get(req.userId);

  if (!enterprise) {
    const insert = db.prepare(`
      INSERT INTO enterprise_info (user_id, company_name, credit_code, legal_person, id_card) 
      VALUES (?, ?, ?, ?, ?)
    `);
    insert.run(req.userId, user.merchant_name, '', user.real_name || '', user.id_card || '');
    enterprise = {
      company_name: user.merchant_name,
      credit_code: '',
      legal_person: user.real_name || '',
      id_card: user.id_card || '',
      verified: 0
    };
  }

  res.json({
    code: 200,
    data: {
      companyName: enterprise.company_name,
      creditCode: enterprise.credit_code,
      legalPerson: enterprise.legal_person,
      idCard: enterprise.id_card,
      verified: enterprise.verified
    }
  });
});

router.post('/verify-enterprise', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const attemptStmt = db.prepare('SELECT * FROM verify_attempts WHERE user_id = ? AND verify_type = ? AND attempt_date = ?');
  let attempt = attemptStmt.get(req.userId, 'enterprise', today);

  if (attempt && attempt.attempts >= 3) {
    return res.json({ code: 429, message: '今日验证次数已达上限，请明日再试' });
  }

  const { companyName, creditCode, legalPerson, idCard } = req.body;

  const verifyPassed = creditCode.length === 18 && idCard.length === 18;

  if (!attempt) {
    db.prepare('INSERT INTO verify_attempts (user_id, verify_type, attempt_date, attempts) VALUES (?, ?, ?, 1)')
      .run(req.userId, 'enterprise', today);
  } else {
    db.prepare('UPDATE verify_attempts SET attempts = attempts + 1 WHERE id = ?')
      .run(attempt.id);
  }

  if (verifyPassed) {
    db.prepare(`
      UPDATE enterprise_info 
      SET company_name = ?, credit_code = ?, legal_person = ?, id_card = ?, verified = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `).run(companyName, creditCode, legalPerson, idCard, req.userId);

    db.prepare('UPDATE users SET real_name = ?, id_card = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(legalPerson, idCard, req.userId);

    const creditStmt = db.prepare('SELECT * FROM credit_apply WHERE user_id = ?');
    const credit = creditStmt.get(req.userId);
    if (!credit) {
      db.prepare('INSERT INTO credit_apply (user_id, amount, available_limit) VALUES (?, ?, ?)')
        .run(req.userId, 100000.00, 100000.00);
    }

    res.json({ code: 200, message: '企业信息验证通过' });
  } else {
    res.json({ code: 400, message: '企业信息验证失败，请检查信息是否正确' });
  }
});

router.post('/sign-auth', authMiddleware, (req, res) => {
  db.prepare('UPDATE credit_apply SET auth_signed = 1, status = \'processing\', updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
    .run(req.userId);

  res.json({ code: 200, message: '授权协议签署成功' });
});

module.exports = router;
