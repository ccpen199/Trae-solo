const { validationResult } = require('express-validator');
const store = require('../config/memoryStore');

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, role, isActive } = req.query;
    
    const params = {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
    
    if (keyword) params.keyword = keyword;
    if (role) params.role = role;
    if (isActive !== undefined) params.isActive = isActive === 'true';

    const result = store.getAllUsers(params);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = store.findUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入参数错误',
        errors: errors.array()
      });
    }

    const { username, password, realName, role, department } = req.body;

    const existingUser = store.findUserByUsername(username);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    const user = await store.createUser({
      username,
      password,
      realName,
      role: role || store.USER_ROLES.USER,
      department
    });

    try {
      store.createOperationLog({
        userId: req.user.id,
        username: req.user.username,
        operationType: store.OPERATION_TYPES.CREATE,
        targetType: 'user',
        targetId: user.id,
        targetName: user.realName,
        newValue: JSON.stringify({
          username: user.username,
          realName: user.realName,
          role: user.role,
          department: user.department
        }),
        description: `管理员创建新用户: ${user.username}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('记录操作日志失败:', logError.message);
    }

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: { user }
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入参数错误',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { realName, role, department, isActive, password } = req.body;

    const user = store.findUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const oldValue = JSON.stringify({
      realName: user.realName,
      role: user.role,
      department: user.department,
      isActive: user.isActive
    });

    const updateData = {};
    if (realName !== undefined) updateData.realName = realName;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.password = password;

    const updatedUser = await store.updateUser(id, updateData);

    const newValue = JSON.stringify({
      realName: updatedUser.realName,
      role: updatedUser.role,
      department: updatedUser.department,
      isActive: updatedUser.isActive
    });

    try {
      store.createOperationLog({
        userId: req.user.id,
        username: req.user.username,
        operationType: store.OPERATION_TYPES.UPDATE,
        targetType: 'user',
        targetId: updatedUser.id,
        targetName: updatedUser.realName,
        oldValue,
        newValue,
        description: `管理员更新用户信息: ${updatedUser.username}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('记录操作日志失败:', logError.message);
    }

    res.json({
      success: true,
      message: '用户更新成功',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = store.findUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }

    const oldValue = JSON.stringify({
      username: user.username,
      realName: user.realName,
      role: user.role
    });

    const success = store.deleteUser(id);

    if (!success) {
      return res.status(500).json({
        success: false,
        message: '删除用户失败'
      });
    }

    try {
      store.createOperationLog({
        userId: req.user.id,
        username: req.user.username,
        operationType: store.OPERATION_TYPES.DELETE,
        targetType: 'user',
        targetId: user.id,
        targetName: user.realName,
        oldValue,
        description: `管理员删除用户: ${user.username}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('记录操作日志失败:', logError.message);
    }

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const getOperationLogs = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, operationType, username, startDate, endDate } = req.query;
    
    const params = {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
    
    if (operationType) params.operationType = operationType;
    if (username) params.username = username;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const result = store.getOperationLogs(params);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取操作日志错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getOperationLogs
};
