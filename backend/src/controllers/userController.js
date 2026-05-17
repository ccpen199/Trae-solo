const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../models/database');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, nickname: user.nickname },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function sendVerificationCode(req, res) {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: '请输入手机号' });
    }

    const code = Math.random().toString().slice(2, 8);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await run(
      'INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)',
      [phone, code, expiresAt]
    );

    res.json({ success: true, message: '验证码已发送', data: { code } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function loginWithCode(req, res) {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    const verification = await get(
      'SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1',
      [phone, code]
    );

    if (!verification) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }

    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: '验证码已过期' });
    }

    await run('UPDATE verification_codes SET used = 1 WHERE id = ?', [verification.id]);

    let user = await get('SELECT * FROM users WHERE phone = ?', [phone]);

    if (!user) {
      const result = await run(
        'INSERT INTO users (phone, nickname, avatar) VALUES (?, ?, ?)',
        [phone, `用户${phone.slice(-4)}`, 'https://via.placeholder.com/100']
      );
      user = await get('SELECT * FROM users WHERE id = ?', [result.id]);
    }

    const token = generateToken(user);
    delete user.password;

    res.json({ success: true, message: '登录成功', data: { user, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function loginWithPassword(req, res) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    const user = await get('SELECT * FROM users WHERE phone = ?', [phone]);

    if (!user) {
      return res.status(400).json({ success: false, message: '用户不存在' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, message: '请使用验证码登录' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: '密码错误' });
    }

    const token = generateToken(user);
    delete user.password;

    res.json({ success: true, message: '登录成功', data: { user, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function thirdPartyLogin(req, res) {
  try {
    const { thirdPartyId, thirdPartyType, nickname, avatar } = req.body;

    if (!thirdPartyId || !thirdPartyType) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    let user = await get(
      'SELECT * FROM users WHERE third_party_id = ? AND third_party_type = ?',
      [thirdPartyId, thirdPartyType]
    );

    if (!user) {
      const result = await run(
        'INSERT INTO users (nickname, avatar, third_party_id, third_party_type) VALUES (?, ?, ?, ?)',
        [nickname || `第三方用户`, avatar || 'https://via.placeholder.com/100', thirdPartyId, thirdPartyType]
      );
      user = await get('SELECT * FROM users WHERE id = ?', [result.id]);
    }

    const token = generateToken(user);
    delete user.password;

    res.json({ success: true, message: '登录成功', data: { user, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function register(req, res) {
  try {
    const { phone, password, code, nickname } = req.body;

    if (!phone || !password || !code) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    const verification = await get(
      'SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1',
      [phone, code]
    );

    if (!verification) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }

    await run('UPDATE verification_codes SET used = 1 WHERE id = ?', [verification.id]);

    const existingUser = await get('SELECT * FROM users WHERE phone = ?', [phone]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '手机号已注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (phone, password, nickname, avatar) VALUES (?, ?, ?, ?)',
      [phone, hashedPassword, nickname || `用户${phone.slice(-4)}`, 'https://via.placeholder.com/100']
    );

    const user = await get('SELECT * FROM users WHERE id = ?', [result.id]);
    const token = generateToken(user);
    delete user.password;

    res.json({ success: true, message: '注册成功', data: { user, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getCurrentUser(req, res) {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    delete user.password;
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const { nickname, bio, avatar, gender, birthday, location } = req.body;
    
    await run(
      'UPDATE users SET nickname = ?, bio = ?, avatar = ?, gender = ?, birthday = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nickname, bio, avatar, gender, birthday, location, req.user.id]
    );

    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    delete user.password;
    res.json({ success: true, message: '更新成功', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function followUser(req, res) {
  try {
    const { followingId } = req.body;
    
    if (followingId === req.user.id) {
      return res.status(400).json({ success: false, message: '不能关注自己' });
    }

    const following = await get('SELECT * FROM users WHERE id = ?', [followingId]);
    if (!following) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    try {
      await run(
        'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
        [req.user.id, followingId]
      );
      res.json({ success: true, message: '关注成功' });
    } catch (e) {
      await run(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
        [req.user.id, followingId]
      );
      res.json({ success: true, message: '取消关注成功' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getUserProfile(req, res) {
  try {
    const { userId } = req.params;
    
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const followerCount = await get('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [userId]);
    const followingCount = await get('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?', [userId]);
    const noteCount = await get('SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND status = 1', [userId]);

    let isFollowing = false;
    if (req.user) {
      const follow = await get(
        'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
        [req.user.id, userId]
      );
      isFollowing = !!follow;
    }

    delete user.password;

    res.json({
      success: true,
      data: {
        ...user,
        followerCount: followerCount.count,
        followingCount: followingCount.count,
        noteCount: noteCount.count,
        isFollowing
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  sendVerificationCode,
  loginWithCode,
  loginWithPassword,
  thirdPartyLogin,
  register,
  getCurrentUser,
  updateUser,
  followUser,
  getUserProfile
};
