const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const generateBvid = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = 'BV';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

router.post('/send-code', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
  }

  const { phone } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  console.log(`验证码 ${phone}: ${code} (测试验证码: 123456)`);
  
  res.json({ success: true, message: `验证码已发送，测试验证码: 123456`, data: { code, testCode: '123456' } });
});

router.post('/register', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('请输入6位验证码')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
  }

  const { phone, password, code } = req.body;

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '该手机号已注册' });
    }

    if (code !== '123456') {
      return res.status(400).json({ success: false, message: '验证码错误，测试验证码：123456' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nickname = `用户${phone.slice(-4)}`;

    const insertUser = db.prepare(`
      INSERT INTO users (phone, password, nickname, avatar, level, exp, coins)
      VALUES (?, ?, ?, ?, 0, 0, 0)
    `);
    const result = insertUser.run(phone, hashedPassword, nickname, '');

    db.prepare('INSERT INTO user_profiles (user_id) VALUES (?)').run(result.lastInsertRowid);

    res.json({ success: true, message: '注册成功，请完成答题转正' });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

router.post('/verify-questions', authenticateToken, (req, res) => {
  const { answers } = req.body;
  
  if (!Array.isArray(answers)) {
    return res.status(400).json({ success: false, message: '答案格式错误' });
  }

  const questions = db.prepare('SELECT id, correct_answer FROM register_questions').all();
  let correctCount = 0;

  answers.forEach(userAnswer => {
    const question = questions.find(q => q.id === userAnswer.questionId);
    if (question && question.correct_answer === userAnswer.answer) {
      correctCount++;
    }
  });

  const passThreshold = Math.ceil(questions.length * 0.6);
  const passed = correctCount >= passThreshold;

  if (passed) {
    db.prepare('UPDATE users SET level = 1, is_verified = 1 WHERE id = ?').run(req.user.id);
    db.prepare('UPDATE user_profiles SET exp = 100 WHERE user_id = ?').run(req.user.id);
  }

  res.json({
    success: true,
    data: {
      passed,
      correctCount,
      total: questions.length,
      message: passed ? '恭喜，答题通过，您已成为正式会员！' : '答题未通过，请重新答题'
    }
  });
});

router.post('/login', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
  }

  const { phone, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.status(400).json({ success: false, message: '手机号或密码错误' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: '手机号或密码错误' });
    }

    if (user.status !== 1) {
      return res.status(403).json({ success: false, message: '账号已被禁用' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const permissions = db.prepare('SELECT * FROM level_permissions WHERE level = ?').get(user.level);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          level: user.level,
          exp: user.exp,
          coins: user.coins,
          vip_type: user.vip_type,
          vip_expire_at: user.vip_expire_at,
          is_verified: user.is_verified,
          permissions: permissions || {}
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

router.get('/questions', (req, res) => {
  const questions = db.prepare('SELECT id, question, options FROM register_questions ORDER BY RANDOM() LIMIT 5').all();
  res.json({
    success: true,
    data: questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }))
  });
});

router.get('/profile', authenticateToken, (req, res) => {
  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
  res.json({
    success: true,
    data: {
      user: req.user,
      profile
    }
  });
});

module.exports = router;
