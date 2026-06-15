import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { addPoints } from '../services/pointService.js';

export const register = async (req, res) => {
  try {
    const { username, password, nickname, phone } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, error: '用户名已存在' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      username,
      password: hashedPassword,
      nickname: nickname || username,
      phone,
      points: 100,
      level: 1,
    });
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'huizhou_community_secret_key',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          points: user.points,
          level: user.level,
        },
      },
      message: '注册成功',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ success: false, error: '用户名或密码错误' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, error: '用户名或密码错误' });
    }
    
    user.lastLoginAt = new Date();
    await user.save();
    
    const today = new Date().toDateString();
    const lastLogin = new Date(user.lastLoginAt).toDateString();
    if (today !== lastLogin) {
      await addPoints(user._id, 5, '每日登录', null, 'login');
    }
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'huizhou_community_secret_key',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          points: user.points,
          level: user.level,
          isAdmin: user.isAdmin,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user._id,
        username: req.user.username,
        nickname: req.user.nickname,
        avatar: req.user.avatar,
        phone: req.user.phone,
        points: req.user.points,
        level: req.user.level,
        isAdmin: req.user.isAdmin,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { nickname, avatar, phone } = req.body;
    
    const user = await User.findById(req.user._id);
    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar;
    if (phone) user.phone = phone;
    await user.save();
    
    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        points: user.points,
        level: user.level,
      },
      message: '更新成功',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
