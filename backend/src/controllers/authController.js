const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: '用户已被禁用，请联系管理员' 
      });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    db.prepare('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const userInfo = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email
    };

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: userInfo
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误', 
      error: error.message 
    });
  }
};

const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    
    const userInfo = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email,
      status: user.status,
      createdAt: user.created_at
    };

    const todoCount = db.prepare(`
      SELECT COUNT(*) as count FROM messages 
      WHERE user_id = ? AND is_todo = 1 AND status = 'unread'
    `).get(user.id);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM messages 
      WHERE user_id = ? AND status = 'unread'
    `).get(user.id);

    res.json({
      success: true,
      data: {
        user: userInfo,
        stats: {
          todoCount: todoCount.count,
          unreadCount: unreadCount.count
        }
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: '请输入原密码和新密码' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: '新密码长度不能少于6位' 
      });
    }

    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    
    const isValidPassword = bcrypt.compareSync(oldPassword, currentUser.password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        message: '原密码错误' 
      });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    db.prepare(`
      UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(hashedPassword, user.id);

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser,
  changePassword
};