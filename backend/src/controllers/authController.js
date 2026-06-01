const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SmsCode = require('../models/SmsCode');

const JWT_SECRET = process.env.JWT_SECRET || 'news-platform-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

exports.sendSmsCode = async (req, res) => {
  try {
    const { phone, type = 'login' } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: '请输入有效的手机号' });
    }

    SmsCode.cleanupExpired();

    const code = SmsCode.generateCode();
    SmsCode.create(phone, type, code);

    console.log(`[SMS] Phone: ${phone}, Code: ${code}`);

    res.json({
      success: true,
      message: '验证码已发送',
      data: {
        phone,
        expiresIn: 300,
        mockCode: code
      }
    });
  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({ success: false, message: '发送验证码失败' });
  }
};

exports.smsLogin = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ success: false, message: '请输入手机号和验证码' });
    }

    if (!SmsCode.verify(phone, code, 'login')) {
      return res.status(400).json({ success: false, message: '验证码错误或已过期' });
    }

    let user = User.findByPhone(phone);
    const isNewUser = !user;

    if (isNewUser) {
      user = User.create({
        phone,
        nickname: `用户${phone.slice(-4)}`,
        is_phone_bound: true
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: isNewUser ? '注册成功' : '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          isNewUser
        }
      }
    });
  } catch (error) {
    console.error('SMS login error:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
};

exports.passwordLogin = async (req, res) => {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return res.status(400).json({ success: false, message: '请输入账号和密码' });
    }

    const user = User.findByAccount(account);

    if (!user) {
      return res.status(401).json({ success: false, message: '账号或密码错误' });
    }

    if (!User.verifyPassword(user, password)) {
      return res.status(401).json({ success: false, message: '账号或密码错误' });
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
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('Password login error:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
};

exports.thirdPartyLogin = async (req, res) => {
  try {
    const { third_party_id, third_party_type, nickname, avatar } = req.body;

    if (!third_party_id || !third_party_type) {
      return res.status(400).json({ success: false, message: '第三方授权信息无效' });
    }

    let user = User.findByThirdParty(third_party_id, third_party_type);
    const isNewUser = !user;

    if (isNewUser) {
      user = User.create({
        nickname: nickname || `${third_party_type}用户`,
        avatar,
        third_party_id,
        third_party_type,
        is_phone_bound: false
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: isNewUser ? '授权成功' : '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          is_phone_bound: user.is_phone_bound,
          isNewUser,
          needBindPhone: !user.is_phone_bound
        }
      }
    });
  } catch (error) {
    console.error('Third party login error:', error);
    res.status(500).json({ success: false, message: '第三方登录失败' });
  }
};

exports.bindPhone = async (req, res) => {
  try {
    const { phone, code } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }

    if (!phone || !code) {
      return res.status(400).json({ success: false, message: '请输入手机号和验证码' });
    }

    if (!SmsCode.verify(phone, code, 'bind')) {
      return res.status(400).json({ success: false, message: '验证码错误或已过期' });
    }

    const existingUser = User.findByPhone(phone);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ success: false, message: '该手机号已被绑定' });
    }

    const user = User.update(userId, { phone, is_phone_bound: true });

    res.json({
      success: true,
      message: '手机号绑定成功',
      data: { user }
    });
  } catch (error) {
    console.error('Bind phone error:', error);
    res.status(500).json({ success: false, message: '绑定失败' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { account, code, newPassword } = req.body;

    if (!account || !code || !newPassword) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    const phone = account.includes('@') ? null : account;
    if (phone && !SmsCode.verify(phone, code, 'reset')) {
      return res.status(400).json({ success: false, message: '验证码错误或已过期' });
    }

    const user = User.findByAccount(account);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    User.update(user.id, { password: newPassword });

    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: '重置密码失败' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const user = User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
};

exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: '退出成功'
  });
};
