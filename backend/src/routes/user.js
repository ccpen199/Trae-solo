const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'pmcaff_jwt_secret_key_2026_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
};

router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password, nickname } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: '用户名长度需要在 3-20 个字符之间'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少 6 个字符'
      });
    }

    const existingUser = await db.prepare('SELECT id FROM users WHERE username = ? OR email = ? OR phone = ?').get(
      username, email || null, phone || null
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱或手机号已被注册'
      });
    }

    const now = Date.now();
    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users (username, email, phone, password, nickname, avatar, bio, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      username,
      email || null,
      phone || null,
      hashedPassword,
      nickname || username,
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20${encodeURIComponent(username)}&image_size=square`,
      '',
      'user',
      1,
      now,
      now
    );

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastID);
    const token = generateToken(user);

    res.json({
      success: true,
      message: '注册成功',
      data: {
        user: sanitizeUser(user),
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return res.status(400).json({
        success: false,
        message: '账号和密码不能为空'
      });
    }

    const user = await db.prepare('SELECT * FROM users WHERE username = ? OR email = ? OR phone = ?').get(
      account, account, account
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '账号不存在'
      });
    }

    if (user.status !== 1) {
      return res.status(400).json({
        success: false,
        message: '账号已被禁用'
      });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '密码错误'
      });
    }

    const token = generateToken(user);

    await db.prepare('UPDATE users SET updated_at = ? WHERE id = ?').run(Date.now(), user.id);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: sanitizeUser(user),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    
    const followers = (await db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(req.user.id)).count;
    const following = (await db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(req.user.id)).count;
    const favorites = (await db.prepare('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?').get(req.user.id)).count;
    const questions = (await db.prepare('SELECT COUNT(*) as count FROM questions WHERE user_id = ? AND status = 1').get(req.user.id)).count;
    const answers = (await db.prepare('SELECT COUNT(*) as count FROM answers WHERE user_id = ? AND status = 1').get(req.user.id)).count;
    const articles = (await db.prepare('SELECT COUNT(*) as count FROM articles WHERE user_id = ? AND status = 1').get(req.user.id)).count;

    res.json({
      success: true,
      data: {
        user: {
          ...sanitizeUser(user),
          followers,
          following,
          favorites,
          questions,
          answers,
          articles
        }
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar, bio } = req.body;
    const now = Date.now();

    const updateFields = [];
    const values = [];

    if (nickname !== undefined) {
      updateFields.push('nickname = ?');
      values.push(nickname);
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      values.push(avatar);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      values.push(bio);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有可更新的字段'
      });
    }

    updateFields.push('updated_at = ?');
    values.push(now);
    values.push(req.user.id);

    await db.prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    res.json({
      success: true,
      message: '更新成功',
      data: {
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    console.error('Update me error:', error);
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '旧密码和新密码不能为空'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少 6 个字符'
      });
    }

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    const isPasswordValid = bcrypt.compareSync(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '旧密码错误'
      });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(hashedPassword, Date.now(), req.user.id);

    console.log(`[短信模拟] 用户 ${user.username} 修改密码，短信已发送`);

    res.json({
      success: true,
      message: '密码修改成功，短信已发送'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败，请稍后重试'
    });
  }
});

router.post('/change-phone', authMiddleware, async (req, res) => {
  try {
    const { phone, verifyCode } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: '手机号不能为空'
      });
    }

    const existing = await db.prepare('SELECT id FROM users WHERE phone = ? AND id != ?').get(phone, req.user.id);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '该手机号已被使用'
      });
    }

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    await db.prepare('UPDATE users SET phone = ?, updated_at = ? WHERE id = ?').run(phone, Date.now(), req.user.id);

    console.log(`[短信模拟] 用户 ${user.username} 修改手机号为 ${phone}，验证短信已发送`);

    res.json({
      success: true,
      message: '手机号修改成功，短信已发送'
    });
  } catch (error) {
    console.error('Change phone error:', error);
    res.status(500).json({
      success: false,
      message: '修改手机号失败，请稍后重试'
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email, phone, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少 6 个字符'
      });
    }

    let user = null;
    if (email) {
      user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    } else if (phone) {
      user = await db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '账号不存在'
      });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(hashedPassword, Date.now(), user.id);

    console.log(`[短信模拟] 用户 ${user.username} 重置密码，短信已发送`);

    res.json({
      success: true,
      message: '密码重置成功，短信已发送'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: '重置密码失败，请稍后重试'
    });
  }
});

router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const user = await db.prepare('SELECT id, username, email, phone, nickname, avatar, bio, role, status, created_at FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.status !== 1 && currentUserId !== id && req.user?.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const followers = (await db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(id)).count;
    const following = (await db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(id)).count;
    const questions = (await db.prepare('SELECT COUNT(*) as count FROM questions WHERE user_id = ? AND status = 1').get(id)).count;
    const answers = (await db.prepare('SELECT COUNT(*) as count FROM answers WHERE user_id = ? AND status = 1').get(id)).count;
    const articles = (await db.prepare('SELECT COUNT(*) as count FROM articles WHERE user_id = ? AND status = 1').get(id)).count;

    let isFollowed = false;
    if (currentUserId && currentUserId !== Number(id)) {
      const follow = await db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, id);
      isFollowed = !!follow;
    }

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          followers,
          following,
          questions,
          answers,
          articles,
          isFollowed,
          phone: currentUserId === id || req.user?.role === 'admin' ? user.phone : null,
          email: currentUserId === id || req.user?.role === 'admin' ? user.email : null
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

module.exports = router;
