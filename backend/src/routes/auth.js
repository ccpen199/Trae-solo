const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      email
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        isPremium: user.isPremium,
        coins: user.coins,
        level: user.level,
        totalFocusTime: user.totalFocusTime,
        treesPlanted: user.treesPlanted,
        currentTree: user.currentTree,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        isPremium: user.isPremium,
        coins: user.coins,
        level: user.level,
        totalFocusTime: user.totalFocusTime,
        treesPlanted: user.treesPlanted,
        currentTree: user.currentTree,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
