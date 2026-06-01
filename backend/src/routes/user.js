const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

router.post('/register', authMiddleware, (req, res) => {
  const { registerAgreed, commissionAgreed } = req.body;

  if (!registerAgreed || !commissionAgreed) {
    return res.json({ code: 400, message: '请同意所有协议' });
  }

  const stmt = db.prepare(`
    UPDATE users 
    SET registered = 1, register_agreed = 1, commission_agreed = 1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(req.userId);

  const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = userStmt.get(req.userId);

  const token = jwt.sign(
    { userId: user.id, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    code: 200,
    message: '注册成功',
    token,
    user: {
      id: user.id,
      phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      merchantName: user.merchant_name,
      registered: 1
    }
  });
});

router.get('/info', authMiddleware, (req, res) => {
  const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = userStmt.get(req.userId);

  const creditStmt = db.prepare('SELECT * FROM credit_apply WHERE user_id = ?');
  const credit = creditStmt.get(req.userId);

  res.json({
    code: 200,
    user: {
      id: user.id,
      phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      merchantName: user.merchant_name,
      registered: user.registered,
      realName: user.real_name,
      creditLimit: credit?.amount || 0,
      availableLimit: credit?.available_limit || 0,
      creditStatus: credit?.status || 'none'
    }
  });
});

module.exports = router;
