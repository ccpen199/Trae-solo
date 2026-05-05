import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { accountService } from '../services/accountService.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      });
    }

    const result = await accountService.register({
      username,
      email,
      phone,
      password
    });

    res.json(result);
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { cid, email, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: '请提供密码'
      });
    }

    if (!cid && !email && !phone) {
      return res.status(400).json({
        success: false,
        message: '请提供CID、邮箱或手机号'
      });
    }

    const result = await accountService.login({
      cid,
      email,
      phone,
      password
    });

    res.json(result);
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    const result = await accountService.logout(req.user.id, token);
    res.json(result);
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, phone, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少为6位'
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: '请提供邮箱或手机号'
      });
    }

    const result = await accountService.resetPassword({
      email,
      phone,
      newPassword
    });

    res.json(result);
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  try {
    const result = accountService.getProfile(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { username, avatar, phone, email } = req.body;
    const result = accountService.updateProfile(req.user.id, {
      username,
      avatar,
      phone,
      email
    });
    res.json(result);
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/search', authenticateToken, (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword || keyword.length < 2) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词至少为2个字符'
      });
    }

    const result = accountService.searchUsers(keyword);
    res.json(result);
  } catch (error) {
    console.error('搜索用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/find-by-cid/:cid', authenticateToken, (req, res) => {
  try {
    const { cid } = req.params;
    const result = accountService.findUserByCID(cid);
    res.json(result);
  } catch (error) {
    console.error('查找用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;
