const db = require('../models/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const sendVerificationCode = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: '请输入手机号'
      });
    }

    const code = '123456';
    
    res.json({
      success: true,
      message: '验证码已发送',
      data: { code }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发送验证码失败'
    });
  }
};

const loginWithPhone = async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: '请输入手机号和验证码'
      });
    }

    if (code !== '123456') {
      return res.status(400).json({
        success: false,
        message: '验证码错误'
      });
    }

    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (!user) {
      const insertUser = db.prepare('INSERT INTO users (phone) VALUES (?)');
      const result = insertUser.run(phone);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          isProfileComplete: user.is_profile_complete
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
};

const loginWithPassword = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: '请输入手机号和密码'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (!user) {
      return res.status(404).json({
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

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '密码错误'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          isProfileComplete: user.is_profile_complete
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
};

const setPassword = async (req, res) => {
  try {
    const { phone, code, password } = req.body;
    
    if (!phone || !code || !password) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }

    if (code !== '123456') {
      return res.status(400).json({
        success: false,
        message: '验证码错误'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(hashedPassword, user.id);

    res.json({
      success: true,
      message: '密码设置成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '设置密码失败'
    });
  }
};

const wechatLogin = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少微信授权码'
      });
    }

    const mockOpenid = 'mock_wechat_' + Date.now();
    
    let user = db.prepare('SELECT * FROM users WHERE wechat_openid = ?').get(mockOpenid);
    
    if (!user) {
      const insertUser = db.prepare('INSERT INTO users (wechat_openid) VALUES (?)');
      const result = insertUser.run(mockOpenid);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          isProfileComplete: user.is_profile_complete
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '微信登录失败'
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        age: user.age,
        graduationStatus: user.graduation_status,
        industry: user.industry,
        profession: user.profession,
        hometown: user.hometown,
        currentCity: user.current_city,
        isProfileComplete: user.is_profile_complete
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

module.exports = {
  sendVerificationCode,
  loginWithPhone,
  loginWithPassword,
  setPassword,
  wechatLogin,
  getCurrentUser
};
