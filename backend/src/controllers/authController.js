const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }
    
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '数据库错误'
        });
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }
      
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }
      
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            phone: user.phone
          }
        }
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '登录失败'
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: '已退出登录'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  login,
  getCurrentUser,
  logout
};
