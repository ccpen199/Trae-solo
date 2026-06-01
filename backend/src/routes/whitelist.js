const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

router.post('/check', (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.json({ code: 400, message: '请提供手机号', inWhitelist: false });
  }

  const stmt = db.prepare('SELECT * FROM whitelist WHERE phone = ? AND status = 1');
  const result = stmt.get(phone);

  if (result) {
    const userStmt = db.prepare('SELECT * FROM users WHERE phone = ?');
    let user = userStmt.get(phone);
    
    if (!user) {
      const insert = db.prepare('INSERT INTO users (phone, merchant_name) VALUES (?, ?)');
      const info = insert.run(phone, result.merchant_name);
      user = {
        id: info.lastInsertRowid,
        phone,
        merchant_name: result.merchant_name,
        registered: 0
      };
    }

    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 200,
      message: '验证通过',
      inWhitelist: true,
      token,
      user: {
        id: user.id,
        phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        merchantName: user.merchant_name,
        registered: user.registered
      }
    });
  } else {
    res.json({
      code: 200,
      message: '暂无法使用',
      inWhitelist: false,
      contactPhone: '400-888-8888'
    });
  }
});

module.exports = router;
