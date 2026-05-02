const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { useMockData } = require('../config/db');
const { mockUsers } = require('../utils/mockData');

// 注册
exports.register = async (req, res) => {
  try {
    const { username, password, role, name, email, phone } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // 创建新用户
    const user = new User({
      username,
      password,
      role,
      name,
      email,
      phone
    });
    
    await user.save();
    
    // 生成token
    const token = jwt.sign({ id: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpire
    });
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    let user;
    if (useMockData) {
      // 使用模拟数据
      user = mockUsers.find(u => u.username === username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      // 简化密码验证，实际应该使用bcrypt
      if (password !== 'admin123' && password !== 'tech123' && password !== 'user123' && password !== 'spare123') {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      // 使用数据库
      user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // 验证密码
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }
    
    // 生成token
    const token = jwt.sign({ id: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpire
    });
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取当前用户信息
exports.getMe = async (req, res) => {
  try {
    let user;
    if (useMockData) {
      // 使用模拟数据
      user = mockUsers.find(u => u._id === req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    } else {
      // 使用数据库
      user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    }
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};