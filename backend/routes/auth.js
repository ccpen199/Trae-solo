const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const SMS_CODE_EXPIRE = parseInt(process.env.SMS_CODE_EXPIRE || '120');

router.post('/send-code', (req, res) => {
  const { phone, type = 'login' } = req.body;

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.json({
      code: 400,
      message: '请输入正确的手机号'
    });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + SMS_CODE_EXPIRE * 1000);

  const db = req.db;
  
  db.prepare(`
    INSERT INTO verification_codes (phone, code, type, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(phone, code, type, expiresAt.toISOString());

  console.log(`[验证码] 手机号: ${phone}, 验证码: ${code}, 有效期: ${SMS_CODE_EXPIRE}秒`);

  res.json({
    code: 200,
    message: '验证码已发送（测试验证码请查看控制台）',
    data: {
      expire_seconds: SMS_CODE_EXPIRE,
      test_code: process.env.NODE_ENV !== 'production' ? code : undefined
    }
  });
});

router.post('/login-code', (req, res) => {
  const { phone, code } = req.body;
  const db = req.db;

  if (!phone || !code) {
    return res.json({
      code: 400,
      message: '请输入手机号和验证码'
    });
  }

  const verificationCode = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE phone = ? AND code = ? AND type = 'login' AND used = 0
    ORDER BY created_at DESC
    LIMIT 1
  `).get(phone, code);

  if (!verificationCode) {
    return res.json({
      code: 400,
      message: '验证码错误'
    });
  }

  const now = new Date();
  if (new Date(verificationCode.expires_at) <= now) {
    return res.json({
      code: 400,
      message: '验证码已过期'
    });
  }

  db.prepare(`UPDATE verification_codes SET used = 1 WHERE id = ?`).run(verificationCode.id);

  let user = db.prepare(`SELECT * FROM users WHERE phone = ?`).get(phone);
  const isNewUser = !user;

  if (!user) {
    const result = db.prepare(`
      INSERT INTO users (phone, nickname, balance, yijie_coins, points)
      VALUES (?, ?, 0, 0, 0)
    `).run(phone, `用户${phone.slice(-4)}`);
    
    user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(result.lastInsertRowid);
  }

  const token = jwt.sign(
    { userId: user.id, phone: user.phone },
    process.env.JWT_SECRET || 'yijie_jwt_secret_key_2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    code: 200,
    message: isNewUser ? '注册登录成功' : '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        balance: user.balance,
        yijie_coins: user.yijie_coins,
        points: user.points,
        is_new_user: isNewUser
      }
    }
  });
});

router.post('/register', (req, res) => {
  const { phone, code, password, passwordConfirm } = req.body;
  const db = req.db;

  if (!phone || !code || !password) {
    return res.json({
      code: 400,
      message: '请填写完整信息'
    });
  }

  if (password !== passwordConfirm) {
    return res.json({
      code: 400,
      message: '两次密码输入不一致'
    });
  }

  if (password.length < 6) {
    return res.json({
      code: 400,
      message: '密码长度至少6位'
    });
  }

  const existingUser = db.prepare(`SELECT * FROM users WHERE phone = ?`).get(phone);
  if (existingUser) {
    return res.json({
      code: 400,
      message: '该手机号已注册'
    });
  }

  const verificationCode = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE phone = ? AND code = ? AND type = 'register' AND used = 0
    ORDER BY created_at DESC
    LIMIT 1
  `).get(phone, code);

  if (!verificationCode) {
    return res.json({
      code: 400,
      message: '验证码错误'
    });
  }

  const now = new Date();
  if (new Date(verificationCode.expires_at) <= now) {
    return res.json({
      code: 400,
      message: '验证码已过期'
    });
  }

  db.prepare(`UPDATE verification_codes SET used = 1 WHERE id = ?`).run(verificationCode.id);

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (phone, password, nickname, balance, yijie_coins, points)
    VALUES (?, ?, ?, 0, 500, 0)
  `).run(phone, hashedPassword, `用户${phone.slice(-4)}`);

  const newCoupon = db.prepare(`SELECT * FROM coupons WHERE name = ?`).get('新人注册礼包券');
  if (newCoupon) {
    db.prepare(`
      INSERT INTO user_coupons (user_id, coupon_id, status)
      VALUES (?, ?, 'unused')
    `).run(result.lastInsertRowid, newCoupon.id);
  }

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(result.lastInsertRowid);

  const token = jwt.sign(
    { userId: user.id, phone: user.phone },
    process.env.JWT_SECRET || 'yijie_jwt_secret_key_2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    code: 200,
    message: '注册成功，已赠送500易捷币和新人礼包',
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        balance: user.balance,
        yijie_coins: user.yijie_coins,
        points: user.points
      }
    }
  });
});

router.post('/login-password', (req, res) => {
  const { phone, password } = req.body;
  const db = req.db;

  if (!phone || !password) {
    return res.json({
      code: 400,
      message: '请输入手机号和密码'
    });
  }

  const user = db.prepare(`SELECT * FROM users WHERE phone = ?`).get(phone);

  if (!user) {
    return res.json({
      code: 400,
      message: '用户不存在'
    });
  }

  if (!user.password) {
    return res.json({
      code: 400,
      message: '未设置密码，请使用验证码登录'
    });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.json({
      code: 400,
      message: '密码错误'
    });
  }

  const token = jwt.sign(
    { userId: user.id, phone: user.phone },
    process.env.JWT_SECRET || 'yijie_jwt_secret_key_2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        balance: user.balance,
        yijie_coins: user.yijie_coins,
        points: user.points
      }
    }
  });
});

router.post('/third-login', (req, res) => {
  const { platform, openId, nickname, avatar } = req.body;
  const db = req.db;

  if (!platform || !openId) {
    return res.json({
      code: 400,
      message: '参数错误'
    });
  }

  let user = db.prepare(`SELECT * FROM users WHERE phone = ?`).get(`third_${platform}_${openId}`);
  const isNewUser = !user;

  if (!user) {
    const result = db.prepare(`
      INSERT INTO users (phone, nickname, avatar, balance, yijie_coins, points)
      VALUES (?, ?, ?, 0, 0, 0)
    `).run(`third_${platform}_${openId}`, nickname || '第三方用户', avatar);
    
    user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(result.lastInsertRowid);
  }

  const token = jwt.sign(
    { userId: user.id, phone: user.phone },
    process.env.JWT_SECRET || 'yijie_jwt_secret_key_2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    code: 200,
    message: isNewUser ? '授权登录成功' : '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        balance: user.balance,
        yijie_coins: user.yijie_coins,
        points: user.points,
        is_new_user: isNewUser,
        need_bind_phone: isNewUser
      }
    }
  });
});

module.exports = router;
