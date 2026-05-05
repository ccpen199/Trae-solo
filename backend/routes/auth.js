const express = require('express');
const router = express.Router();
const { verifyLogin, createSession, deleteSession, getSession } = require('../middleware/auth');
const { getQuery, runQuery } = require('../database');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }
    
    const user = await verifyLogin(username, password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    const sessionId = await createSession(user.id);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        sessionId,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.query.session_id;
    
    if (sessionId) {
      await deleteSession(sessionId);
    }
    
    res.json({
      success: true,
      message: '已退出登录'
    });
  } catch (error) {
    console.error('退出登录失败:', error);
    res.status(500).json({
      success: false,
      message: '退出登录失败'
    });
  }
});

router.get('/me', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.query.session_id;
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }
    
    const session = await getSession(sessionId);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: '登录已过期'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: session.user_id,
          username: session.username,
          role: session.role
        }
      }
    });
  } catch (error) {
    console.error('获取当前用户失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.query.session_id;
    const { oldPassword, newPassword } = req.body;
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }
    
    const session = await getSession(sessionId);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: '登录已过期'
      });
    }
    
    const user = getQuery('SELECT * FROM users WHERE id = ?', [session.user_id]);
    
    if (user.password !== oldPassword) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }
    
    runQuery('UPDATE users SET password = ? WHERE id = ?', [newPassword, session.user_id]);
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
});

module.exports = router;
