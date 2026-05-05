const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { cache } = require('../config/redis');
const db = require('../models');
const logger = require('../utils/logger');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'student_grade_management_jwt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    const user = await db.User.findOne({
      where: { username },
      include: [{
        model: db.Role,
        as: 'role',
        attributes: ['id', 'name', 'code']
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (!user.status) {
      return res.status(403).json({
        success: false,
        message: '用户已被禁用，请联系管理员'
      });
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      logger.warn(`登录失败 - 用户名: ${username}, 原因: 密码错误, IP: ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roleId: user.roleId,
        roleCode: user.role?.code
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await user.update({
      lastLoginAt: new Date(),
      lastLoginIp: req.ip
    });

    logger.info(`登录成功 - 用户: ${user.username}, 角色: ${user.role?.name}, IP: ${req.ip}`);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          gender: user.gender,
          phone: user.phone,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
  } catch (error) {
    logger.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试',
      error: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await cache.set(`blacklist:token:${token}`, true, ttl);
        }
      }
    }

    logger.info(`用户登出 - 用户ID: ${req.user?.id}`);

    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    logger.error('登出失败:', error);
    res.status(500).json({
      success: false,
      message: '登出失败',
      error: error.message
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await db.User.findOne({
      where: { id: req.user.id },
      include: [
        {
          model: db.Role,
          as: 'role',
          attributes: ['id', 'name', 'code']
        },
        {
          model: db.Student,
          as: 'studentInfo',
          include: [
            {
              model: db.Class,
              as: 'classInfo',
              include: [
                {
                  model: db.Department,
                  as: 'department'
                }
              ]
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const userData = {
      id: user.id,
      username: user.username,
      name: user.name,
      gender: user.gender,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      lastLoginAt: user.lastLoginAt
    };

    if (user.studentInfo) {
      userData.studentInfo = {
        studentNo: user.studentInfo.studentNo,
        classId: user.studentInfo.classId,
        className: user.studentInfo.classInfo?.name,
        departmentId: user.studentInfo.classInfo?.departmentId,
        departmentName: user.studentInfo.classInfo?.department?.name,
        idCard: user.studentInfo.idCard,
        birthDate: user.studentInfo.birthDate,
        address: user.studentInfo.address,
        enrollmentDate: user.studentInfo.enrollmentDate,
        status: user.studentInfo.status
      };
    }

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    logger.error('获取当前用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '旧密码和新密码不能为空'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度不能少于6位'
      });
    }

    const user = await db.User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const isValidOldPassword = await user.validatePassword(oldPassword);
    if (!isValidOldPassword) {
      return res.status(400).json({
        success: false,
        message: '旧密码错误'
      });
    }

    await user.update({ password: newPassword });

    logger.info(`密码修改成功 - 用户: ${user.username}`);

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    logger.error('密码修改失败:', error);
    res.status(500).json({
      success: false,
      message: '密码修改失败',
      error: error.message
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser,
  changePassword
};
