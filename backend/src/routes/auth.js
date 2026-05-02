const express = require('express');
const router = express.Router();
const authService = require('../services/AuthService');
const { authenticateToken } = require('../middlewares/auth');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, realName, phone } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名、邮箱和密码为必填项' 
      });
    }

    const result = await authService.register({
      username,
      email,
      password,
      role: role || 'client',
      realName,
      phone
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码为必填项' 
      });
    }

    const result = await authService.login(username, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await authService.getCurrentUser(req.user.id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { realName, phone, avatarUrl } = req.body;
    
    const result = await authService.updateProfile(req.user.id, {
      real_name: realName,
      phone,
      avatar_url: avatarUrl
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: '原密码和新密码为必填项' 
      });
    }

    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '已登出'
  });
});

module.exports = router;
