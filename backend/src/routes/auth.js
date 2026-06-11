const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../utils/database');

const router = express.Router();

router.post('/ganfutong/login', (req, res) => {
  const { gft_user_id, id_card, name, phone } = req.body;
  if (!gft_user_id || !name) {
    return res.status(400).json({ code: 400, message: '赣服通认证参数不完整' });
  }
  let user = db.prepare('SELECT * FROM users WHERE gft_user_id = ?').get(gft_user_id);
  if (!user && id_card) {
    user = db.prepare('SELECT * FROM users WHERE id_card = ?').get(id_card);
  }
  if (!user) {
    const result = db.prepare('INSERT INTO users (gft_user_id, id_card, name, phone, user_type) VALUES (?, ?, ?, ?, ?)').run(
      gft_user_id, id_card || null, name, phone || null, 'personal'
    );
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  } else {
    db.prepare('UPDATE users SET gft_user_id = COALESCE(?, gft_user_id), name = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(
      gft_user_id, name, user.id
    );
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  }
  const token = jwt.sign(
    { userId: user.id, userType: user.user_type },
    process.env.SESSION_SECRET || 'jx_rs_session_secret_2024',
    { expiresIn: '7d' }
  );
  res.json({ code: 0, data: { token, user, gateway: process.env.GANFUTONG_GATEWAY } });
});

router.post('/enterprise/login', (req, res) => {
  const { gft_user_id, unified_credit_code, enterprise_name, legal_person, contact_phone } = req.body;
  if (!enterprise_name || !unified_credit_code) {
    return res.status(400).json({ code: 400, message: '企业认证参数不完整' });
  }
  const virtual_gft_id = `ent_${unified_credit_code}`;
  const effective_gft = gft_user_id && gft_user_id.trim() ? gft_user_id : virtual_gft_id;
  let enterprise = db.prepare('SELECT * FROM enterprises WHERE unified_credit_code = ?').get(unified_credit_code);
  let user = null;
  if (enterprise) {
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(enterprise.user_id);
  }
  if (!user) {
    user = db.prepare('SELECT * FROM users WHERE gft_user_id = ?').get(effective_gft);
  }
  if (!user) {
    try {
      const userResult = db.prepare('INSERT INTO users (gft_user_id, name, phone, user_type) VALUES (?, ?, ?, ?)').run(
        effective_gft, legal_person || enterprise_name, contact_phone || null, 'enterprise'
      );
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userResult.lastInsertRowid);
    } catch (e) {
      user = db.prepare('SELECT * FROM users WHERE gft_user_id = ?').get(effective_gft);
    }
  }
  if (!enterprise) {
    db.prepare('INSERT INTO enterprises (user_id, enterprise_name, unified_credit_code, legal_person, contact_phone) VALUES (?, ?, ?, ?, ?)').run(
      user.id, enterprise_name, unified_credit_code, legal_person || null, contact_phone || null
    );
    enterprise = db.prepare('SELECT * FROM enterprises WHERE unified_credit_code = ?').get(unified_credit_code);
  }
  const token = jwt.sign(
    { userId: user.id, enterpriseId: enterprise.id, userType: 'enterprise' },
    process.env.SESSION_SECRET || 'jx_rs_session_secret_2024',
    { expiresIn: '7d' }
  );
  res.json({ code: 0, data: { token, user, enterprise } });
});

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '请输入用户名和密码' });
  }
  const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }
  const token = jwt.sign(
    { adminId: admin.id, role: admin.role },
    process.env.SESSION_SECRET || 'jx_rs_session_secret_2024',
    { expiresIn: '1d' }
  );
  res.json({ code: 0, data: { token, admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role } } });
});

module.exports = router;
