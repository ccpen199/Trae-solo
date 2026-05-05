const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { cache } = require('../config/redis');

const userController = {
  
  register: async (req, res) => {
    try {
      const { phone, password, idCard, realName, city, district, project, building, floor, houseType, houseArea, floorPlanUrl } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: '手机号不能为空'
        });
      }

      const existingUser = await User.findOne({ where: { phone } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '手机号已注册'
        });
      }

      const userData = {
        phone,
        password: password || phone.slice(-6),
        idCard,
        realName,
        city,
        district,
        project,
        building,
        floor: floor ? parseInt(floor) : null,
        houseType,
        houseArea: houseArea ? parseFloat(houseArea) : null,
        floorPlanUrl
      };

      const user = await User.create(userData);

      const token = jwt.sign(
        { userId: user.id, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      await cache.del(`user:${user.id}`);

      const userInfo = user.toJSON();
      delete userInfo.password;

      res.json({
        success: true,
        message: '注册成功',
        data: {
          token,
          user: userInfo,
          defaultPassword: !password ? phone.slice(-6) : null
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '注册失败',
        error: error.message
      });
    }
  },

  login: async (req, res) => {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return res.status(400).json({
          success: false,
          message: '手机号和密码不能为空'
        });
      }

      const user = await User.findOne({ where: { phone } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      if (user.status !== 1) {
        return res.status(403).json({
          success: false,
          message: '用户已被禁用'
        });
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: '密码错误'
        });
      }

      user.lastLoginAt = new Date();
      await user.save();

      const token = jwt.sign(
        { userId: user.id, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const userInfo = user.toJSON();
      delete userInfo.password;

      await cache.set(`user:${user.id}`, userInfo, 1800);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: userInfo
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '登录失败',
        error: error.message
      });
    }
  },

  getProfile: async (req, res) => {
    try {
      const userId = req.userId;
      
      const cacheKey = `user:${userId}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const userInfo = user.toJSON();
      delete userInfo.password;

      await cache.set(cacheKey, userInfo, 1800);

      res.json({
        success: true,
        data: userInfo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取用户信息失败',
        error: error.message
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.userId;
      const { realName, idCard, city, district, project, building, floor, houseType, houseArea, floorPlanUrl, avatar } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const updateData = {};
      if (realName !== undefined) updateData.realName = realName;
      if (idCard !== undefined) updateData.idCard = idCard;
      if (city !== undefined) updateData.city = city;
      if (district !== undefined) updateData.district = district;
      if (project !== undefined) updateData.project = project;
      if (building !== undefined) updateData.building = building;
      if (floor !== undefined) updateData.floor = floor ? parseInt(floor) : null;
      if (houseType !== undefined) updateData.houseType = houseType;
      if (houseArea !== undefined) updateData.houseArea = houseArea ? parseFloat(houseArea) : null;
      if (floorPlanUrl !== undefined) updateData.floorPlanUrl = floorPlanUrl;
      if (avatar !== undefined) updateData.avatar = avatar;

      await user.update(updateData);

      await cache.del(`user:${userId}`);

      const userInfo = user.toJSON();
      delete userInfo.password;

      res.json({
        success: true,
        message: '更新成功',
        data: userInfo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '更新用户信息失败',
        error: error.message
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const userId = req.userId;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '原密码和新密码不能为空'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: '新密码长度不能少于6位'
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const isValidPassword = await user.validatePassword(oldPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: '原密码错误'
        });
      }

      user.password = newPassword;
      await user.save();

      await cache.del(`user:${userId}`);

      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '修改密码失败',
        error: error.message
      });
    }
  }
};

module.exports = userController;
