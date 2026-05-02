const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../memoryStore');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    const existingUser = db.findOne('users', { email }) || db.findOne('users', { username });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用' 
      });
    }

    const user = db.create('users', {
      username,
      email,
      password: db._hashPassword(password),
      role: role || 'student',
      avatar: '',
      bio: '',
      phone: '',
      status: 'active'
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'online-learning-platform-jwt-secret-key-2024',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: '注册失败', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.findOne('users', { email });
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    const isMatch = db.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: '账户已被禁用' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'online-learning-platform-jwt-secret-key-2024',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: '登录失败', error: error.message });
  }
});

router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: '未授权' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'online-learning-platform-jwt-secret-key-2024');
    
    const user = db.findById('users', decoded.userId);
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的 token' });
    }
    res.status(500).json({ message: '获取用户信息失败', error: error.message });
  }
});

router.put('/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: '未授权' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'online-learning-platform-jwt-secret-key-2024');
    
    const { username, avatar, bio, phone } = req.body;
    const user = db.findById('users', decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    if (username && username !== user.username) {
      const existing = db.findOne('users', { username });
      if (existing && existing._id !== user._id) {
        return res.status(400).json({ message: '用户名已被使用' });
      }
    }

    const updatedUser = db.findByIdAndUpdate('users', user._id, {
      username: username || user.username,
      avatar: avatar !== undefined ? avatar : user.avatar,
      bio: bio !== undefined ? bio : user.bio,
      phone: phone !== undefined ? phone : user.phone
    });

    res.json({
      message: '更新成功',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的 token' });
    }
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

router.put('/password', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: '未授权' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'online-learning-platform-jwt-secret-key-2024');
    
    const { currentPassword, newPassword } = req.body;
    const user = db.findById('users', decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    const isMatch = db.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '当前密码错误' });
    }

    db.findByIdAndUpdate('users', user._id, {
      password: db._hashPassword(newPassword)
    });

    res.json({ message: '密码修改成功' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的 token' });
    }
    res.status(500).json({ message: '密码修改失败', error: error.message });
  }
});

module.exports = router;
