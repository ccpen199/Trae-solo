const db = require('../database/init');
const jwt = require('jsonwebtoken');

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendSmsCode = (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({
      code: 400,
      message: '请输入正确的手机号',
      data: null
    });
  }

  const code = generateCode();
  const expireSeconds = parseInt(process.env.SMS_CODE_EXPIRE_SECONDS) || 300;
  const expireAt = new Date(Date.now() + expireSeconds * 1000).toISOString();

  console.log(`[模拟短信] 手机号: ${phone}, 验证码: ${code}`);

  try {
    db.prepare('INSERT INTO sms_codes (phone, code, expire_at) VALUES (?, ?, ?)').run(phone, code, expireAt);

    res.json({
      code: 200,
      message: '验证码已发送',
      data: {
        phone,
        expireSeconds,
        debugCode: process.env.NODE_ENV !== 'production' ? code : undefined
      }
    });
  } catch (err) {
    console.error('发送验证码失败:', err);
    return res.status(500).json({
      code: 500,
      message: '发送验证码失败',
      data: null
    });
  }
};

const loginWithCode = (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({
      code: 400,
      message: '请输入正确的手机号',
      data: null
    });
  }

  if (!code || code.length !== 6) {
    return res.status(400).json({
      code: 400,
      message: '请输入正确的验证码',
      data: null
    });
  }

  try {
    const smsRecord = db.prepare(
      'SELECT * FROM sms_codes WHERE phone = ? AND code = ? AND used = 0 AND expire_at > ? ORDER BY created_at DESC LIMIT 1'
    ).get(phone, code, new Date().toISOString());

    if (!smsRecord) {
      return res.status(400).json({
        code: 400,
        message: '验证码无效或已过期',
        data: null
      });
    }

    db.prepare('UPDATE sms_codes SET used = 1 WHERE id = ?').run(smsRecord.id);

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    const isNewUser = !user;

    if (isNewUser) {
      const result = db.prepare('INSERT INTO users (phone, nickname) VALUES (?, ?)').run(phone, `用户${phone.slice(-4)}`);
      const userId = result.lastInsertRowid;
      return generateTokenAndResponse(res, userId, phone, true);
    } else {
      return generateTokenAndResponse(res, user.id, user.phone, false, user);
    }
  } catch (err) {
    console.error('登录失败:', err);
    return res.status(500).json({
      code: 500,
      message: '登录失败',
      data: null
    });
  }
};

const generateTokenAndResponse = (res, userId, phone, isNewUser, userData = null) => {
  const token = jwt.sign(
    { userId, phone },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  if (!userData) {
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (!user) {
        return res.status(500).json({
          code: 500,
          message: '获取用户信息失败',
          data: null
        });
      }
      sendLoginResponse(res, user, token, isNewUser);
    } catch (err) {
      return res.status(500).json({
        code: 500,
        message: '获取用户信息失败',
        data: null
      });
    }
  } else {
    sendLoginResponse(res, userData, token, isNewUser);
  }
};

const sendLoginResponse = (res, user, token, isNewUser) => {
  try {
    const levelInfo = db.prepare('SELECT * FROM member_levels WHERE level = ?').get(user.level);
    
    const response = {
      code: 200,
      message: '登录成功',
      data: {
        token,
        isNewUser,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          level: user.level,
          levelName: levelInfo?.name || '青铜会员',
          growthPoints: user.growth_points,
          points: user.points
        }
      }
    };

    res.json(response);
  } catch (err) {
    console.error('获取会员等级失败:', err);
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        isNewUser,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          level: user.level,
          levelName: '青铜会员',
          growthPoints: user.growth_points,
          points: user.points
        }
      }
    });
  }
};

const getCurrentUser = (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    const levelInfo = db.prepare('SELECT * FROM member_levels WHERE level = ?').get(user.level);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        level: user.level,
        levelName: levelInfo?.name || '青铜会员',
        growthPoints: user.growth_points,
        points: user.points,
        minGrowth: levelInfo?.min_growth || 0,
        maxGrowth: levelInfo?.max_growth || 999,
        discount: levelInfo?.discount || 1.00,
        isNewUser: user.is_new_user === 1
      }
    });
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return res.status(500).json({
      code: 500,
      message: '获取用户信息失败',
      data: null
    });
  }
};

const updateUser = (req, res) => {
  const { nickname, avatar } = req.body;

  const fields = [];
  const values = [];

  if (nickname !== undefined) {
    fields.push('nickname = ?');
    values.push(nickname);
  }

  if (avatar !== undefined) {
    fields.push('avatar = ?');
    values.push(avatar);
  }

  if (fields.length === 0) {
    return res.status(400).json({
      code: 400,
      message: '没有需要更新的内容',
      data: null
    });
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.user.id);

  try {
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    getCurrentUser(req, res);
  } catch (err) {
    console.error('更新用户信息失败:', err);
    return res.status(500).json({
      code: 500,
      message: '更新失败',
      data: null
    });
  }
};

module.exports = {
  sendSmsCode,
  loginWithCode,
  getCurrentUser,
  updateUser
};
