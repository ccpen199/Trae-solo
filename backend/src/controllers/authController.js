const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { success, fail } = require('../utils/response');

const authController = {
  register: (req, res) => {
    try {
      const { username, email, password, nickname } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json(fail('用户名、邮箱和密码不能为空'));
      }

      const existingUser = db.getTable('users').find(u => u.username === username || u.email === email);
      if (existingUser) {
        return res.status(400).json(fail('用户名或邮箱已存在'));
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const result = db.insert('users', { 
        username, 
        email, 
        password: hashedPassword, 
        nickname: nickname || username, 
        role: 'user',
        status: 'active'
      });

      const token = jwt.sign(
        { id: result.id, username, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json(success({ token }, '注册成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('注册失败'));
    }
  },

  login: (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json(fail('用户名和密码不能为空'));
      }

      const user = db.getTable('users').find(u => u.username === username || u.email === username);
      if (!user) {
        return res.status(401).json(fail('用户不存在'));
      }

      if (user.status !== 'active') {
        return res.status(403).json(fail('账号已被禁用'));
      }

      const isValid = bcrypt.compareSync(password, user.password);
      if (!isValid) {
        return res.status(401).json(fail('密码错误'));
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const userInfo = {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role
      };

      res.json(success({ token, user: userInfo }, '登录成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('登录失败'));
    }
  },

  getCurrentUser: (req, res) => {
    try {
      const user = db.findById('users', req.user.id);
      if (!user) {
        return res.status(404).json(fail('用户不存在'));
      }
      const { password, ...userInfo } = user;
      res.json(success(userInfo));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('获取用户信息失败'));
    }
  },

  updateProfile: (req, res) => {
    try {
      const { nickname, bio, avatar } = req.body;
      
      const updates = {};
      if (nickname !== undefined) updates.nickname = nickname;
      if (bio !== undefined) updates.bio = bio;
      if (avatar !== undefined) updates.avatar = avatar;
      updates.updated_at = new Date().toISOString();
      
      db.update('users', req.user.id, updates);

      const user = db.findById('users', req.user.id);
      const { password, ...userInfo } = user;
      res.json(success(userInfo, '更新成功'));
    } catch (err) {
      console.error(err);
      res.status(500).json(fail('更新失败'));
    }
  }
};

module.exports = authController;
