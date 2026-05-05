const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'furniture_platform_jwt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationCode = async (phone, type) => {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const stmt = db.prepare(`
    INSERT INTO verification_codes (phone, code, type, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(phone, code, type, expiresAt);

  console.log(`发送验证码: 手机号=${phone}, 验证码=${code}, 类型=${type}`);
  return code;
};

const register = async (req, res) => {
  try {
    const { phone, code, password, email, username } = req.body;

    if (!phone || !code || !password) {
      return res.status(400).json({
        success: false,
        message: '请填写完整信息'
      });
    }

    const codeRecord = db.prepare(`
      SELECT * FROM verification_codes 
      WHERE phone = ? AND code = ? AND type = 'register' AND used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `).get(phone, code);

    if (!codeRecord) {
      return res.status(400).json({
        success: false,
        message: '验证码无效'
      });
    }

    if (new Date(codeRecord.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: '验证码已过期'
      });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该手机号已注册'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (phone, email, username, password, role)
      VALUES (?, ?, ?, ?, 'user')
    `);
    const result = stmt.run(phone, email || null, username || `用户${phone.slice(-4)}`, hashedPassword);

    db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(codeRecord.id);

    const user = db.prepare('SELECT id, phone, email, username, avatar, role FROM users WHERE id = ?').get(result.lastInsertRowid);

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: '注册成功',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败'
    });
  }
};

const login = async (req, res) => {
  try {
    const { phone, password, code } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: '请输入手机号'
      });
    }

    let user;

    if (code) {
      const codeRecord = db.prepare(`
        SELECT * FROM verification_codes 
        WHERE phone = ? AND code = ? AND type = 'login' AND used = 0
        ORDER BY created_at DESC
        LIMIT 1
      `).get(phone, code);

      if (!codeRecord) {
        return res.status(400).json({
          success: false,
          message: '验证码无效'
        });
      }

      if (new Date(codeRecord.expires_at) < new Date()) {
        return res.status(400).json({
          success: false,
          message: '验证码已过期'
        });
      }

      db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(codeRecord.id);

      user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

      if (!user) {
        const stmt = db.prepare(`
          INSERT INTO users (phone, username, role)
          VALUES (?, ?, 'user')
        `);
        const result = stmt.run(phone, `用户${phone.slice(-4)}`);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      }
    } else if (password) {
      user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

      if (!user) {
        return res.status(400).json({
          success: false,
          message: '手机号或密码错误'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: '手机号或密码错误'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: '请输入密码或验证码'
      });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const safeUser = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role
    };

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: safeUser,
        token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
};

const sendCode = async (req, res) => {
  try {
    const { phone, type } = req.body;

    if (!phone || !type) {
      return res.status(400).json({
        success: false,
        message: '请输入手机号和验证码类型'
      });
    }

    const existingCode = db.prepare(`
      SELECT * FROM verification_codes 
      WHERE phone = ? AND type = ? AND used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `).get(phone, type);

    if (existingCode) {
      const timeDiff = Date.now() - new Date(existingCode.created_at).getTime();
      if (timeDiff < 60 * 1000) {
        return res.status(400).json({
          success: false,
          message: '请等待60秒后再发送'
        });
      }
    }

    if (type === 'register') {
      const existingUser = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该手机号已注册'
        });
      }
    }

    const code = await sendVerificationCode(phone, type);

    res.json({
      success: true,
      message: '验证码已发送',
      data: {
        phone,
        code: code,
        expiresIn: 300
      }
    });
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({
      success: false,
      message: '发送验证码失败'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = db.prepare(`
      SELECT id, phone, email, username, avatar, role, created_at
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const favoriteCount = db.prepare(`
      SELECT COUNT(*) as count FROM favorites WHERE user_id = ?
    `).get(userId).count;

    const followingCount = db.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE follower_id = ?
    `).get(userId).count;

    const followerCount = db.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE following_id = ?
    `).get(userId).count;

    res.json({
      success: true,
      data: {
        ...user,
        favoriteCount,
        followingCount,
        followerCount
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, avatar } = req.body;

    const fields = [];
    const values = [];

    if (username) {
      fields.push('username = ?');
      values.push(username);
    }
    if (email) {
      fields.push('email = ?');
      values.push(email);
    }
    if (avatar) {
      fields.push('avatar = ?');
      values.push(avatar);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有需要更新的字段'
      });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const stmt = db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    const user = db.prepare(`
      SELECT id, phone, email, username, avatar, role FROM users WHERE id = ?
    `).get(userId);

    res.json({
      success: true,
      message: '更新成功',
      data: user
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请输入原密码和新密码'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(hashedPassword, userId);

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
};

module.exports = {
  register,
  login,
  sendCode,
  getProfile,
  updateProfile,
  changePassword
};
