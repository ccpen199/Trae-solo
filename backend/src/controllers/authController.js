const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../models/db');

const sendCode = (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: '请输入手机号'
    });
  }

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({
      success: false,
      message: '手机号格式不正确'
    });
  }

  const code = Math.random().toString().slice(2, 6);
  console.log(`验证码 ${phone}: ${code}`);

  res.json({
    success: true,
    message: '验证码已发送',
    data: { code }
  });
};

const login = (req, res) => {
  const { phone, code, password, agreedToTerms } = req.body;

  if (!agreedToTerms) {
    return res.status(400).json({
      success: false,
      message: '请先同意用户协议和隐私政策'
    });
  }

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: '请输入手机号'
    });
  }

  const getUser = db.prepare('SELECT * FROM users WHERE phone = ?');
  const user = getUser.get(phone);

  if (code) {
    if (code.length < 4 || !/^\d{4,6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: '验证码格式错误'
      });
    }

    if (!user) {
      const nickname = `Soul${Math.random().toString(36).slice(2, 8)}`;
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`;
      
      const insertUser = db.prepare('INSERT INTO users (phone, nickname, avatar) VALUES (?, ?, ?)');
      const result = insertUser.run(phone, nickname, avatar);
      const userId = result.lastInsertRowid;

      const token = jwt.sign(
        { userId, phone },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: userId,
            phone,
            nickname,
            avatar
          }
        }
      });
    } else {
      const token = jwt.sign(
        { userId: user.id, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            phone: user.phone,
            nickname: user.nickname,
            avatar: user.avatar,
            gender: user.gender,
            bio: user.bio
          }
        }
      });
    }
  } else if (password) {
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: '请使用验证码登录'
      });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '密码错误'
      });
    }

    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          gender: user.gender,
          bio: user.bio
        }
      }
    });
  } else {
    return res.status(400).json({
      success: false,
      message: '请输入验证码或密码'
    });
  }
};

const getCurrentUser = (req, res) => {
  const userId = req.user.userId;

  const getUser = db.prepare('SELECT id, phone, nickname, avatar, gender, bio, birthday, location, created_at FROM users WHERE id = ?');
  const user = getUser.get(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
};

const updateProfile = (req, res) => {
  const userId = req.user.userId;
  const { nickname, avatar, gender, bio, birthday, location } = req.body;

  const getCurrent = db.prepare('SELECT nickname, avatar, gender, bio, birthday, location FROM users WHERE id = ?');
  const current = getCurrent.get(userId);

  const updateUser = db.prepare(`
    UPDATE users SET 
      nickname = COALESCE(?, nickname),
      avatar = COALESCE(?, avatar),
      gender = COALESCE(?, gender),
      bio = COALESCE(?, bio),
      birthday = COALESCE(?, birthday),
      location = COALESCE(?, location),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  updateUser.run(
    nickname || current.nickname,
    avatar || current.avatar,
    gender || current.gender,
    bio || current.bio,
    birthday || current.birthday,
    location || current.location,
    userId
  );

  const getUser = db.prepare('SELECT id, phone, nickname, avatar, gender, bio, birthday, location FROM users WHERE id = ?');
  const user = getUser.get(userId);

  res.json({
    success: true,
    message: '更新成功',
    data: { user }
  });
};

module.exports = { sendCode, login, getCurrentUser, updateProfile };
