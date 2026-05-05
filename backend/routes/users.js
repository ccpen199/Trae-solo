const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const { validateUpdateProfile } = require('../utils/validation');
const { ensureAuthenticated, ensureAdmin, ensureSelfOrAdmin } = require('../middleware/auth');

router.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { username, role } = req.query;
    const filters = {};
    
    if (username) filters.username = username;
    if (role) filters.role = role;
    
    const users = await userModel.getAllUsers(filters);
    
    res.json({
      success: true,
      data: users
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

router.get('/:id', ensureAuthenticated, ensureSelfOrAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await userModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.put('/:id', ensureAuthenticated, ensureSelfOrAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { password, confirmPassword, age, gender } = req.body;
    
    const isPasswordUpdate = password && password !== '';
    const validation = validateUpdateProfile({ 
      password, confirmPassword, age, gender 
    }, isPasswordUpdate);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join('; ')
      });
    }
    
    const updateData = {};
    if (password && password !== '') {
      updateData.password = password;
    }
    if (age !== undefined && age !== null && age !== '') {
      updateData.age = age;
    }
    if (gender !== undefined && gender !== null && gender !== '') {
      updateData.gender = gender;
    }
    
    const updatedUser = await userModel.updateUser(userId, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      message: '资料更新成功',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: '更新用户资料失败'
    });
  }
});

router.delete('/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId === req.session.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账号'
      });
    }
    
    const deleted = await userModel.deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      message: '用户已删除'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    });
  }
});

module.exports = router;
