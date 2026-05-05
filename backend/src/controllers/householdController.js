const { validationResult } = require('express-validator');
const store = require('../config/memoryStore');

const getAllHouseholds = async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      name, 
      idCard, 
      status,
      currentAddress,
      householdAddress
    } = req.query;
    
    const params = {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
    
    if (name) params.name = name;
    if (idCard) params.idCard = idCard;
    if (status) params.status = status;
    if (currentAddress) params.currentAddress = currentAddress;
    if (householdAddress) params.householdAddress = householdAddress;

    const result = store.getAllHouseholds(params);

    try {
      store.createOperationLog({
        userId: req.user.id,
        username: req.user.username,
        operationType: store.OPERATION_TYPES.QUERY,
        targetType: 'household',
        description: '查询户籍列表',
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('记录操作日志失败:', logError.message);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取户籍列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const getHouseholdById = async (req, res) => {
  try {
    const { id } = req.params;

    const household = store.findHouseholdById(id);

    if (!household) {
      return res.status(404).json({
        success: false,
        message: '户籍信息不存在'
      });
    }

    try {
      store.createOperationLog({
        userId: req.user.id,
        username: req.user.username,
        operationType: store.OPERATION_TYPES.QUERY,
        targetType: 'household',
        targetId: household.id,
        targetName: household.name,
        description: `查询户籍详情: ${household.name}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('记录操作日志失败:', logError.message);
    }

    res.json({
      success: true,
      data: { household }
    });
  } catch (error) {
    console.error('获取户籍信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const searchHousehold = async (req, res) => {
  try {
    const { keyword, type = 'all' } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请输入搜索关键词'
      });
    }

    const result = store.searchHouseholds({ keyword, type });

    try {
      store.createOperationLog({
        userId: req.user.id,
        username: req.user.username,
        operationType: store.OPERATION_TYPES.QUERY,
        targetType: 'household',
        description: `搜索户籍: 关键词=${keyword}, 类型=${type}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('记录操作日志失败:', logError.message);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('搜索户籍信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const createHousehold = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入参数错误',
        errors: errors.array()
      });
    }

    const householdData = req.body;

    const existingHousehold = store.findHouseholdByIdCard(householdData.idCard);

    if (existingHousehold) {
      return res.status(400).json({
        success: false,
        message: '该身份证号已存在户籍记录'
      });
    }

    const household = store.createHousehold(householdData);

    try {
      store.createOperationLog({
        userId: req.user.id,
        username: req.user.username,
        operationType: store.OPERATION_TYPES.CREATE,
        targetType: 'household',
        targetId: household.id,
        targetName: household.name,
        newValue: JSON.stringify({
          name: household.name,
          idCard: household.idCard,
          gender: household.gender,
          age: household.age,
          currentAddress: household.currentAddress,
          householdAddress: household.householdAddress
        }),
        description: `新增户籍: ${household.name}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('记录操作日志失败:', logError.message);
    }

    res.status(201).json({
      success: true,
      message: '户籍信息创建成功',
      data: { household }
    });
  } catch (error) {
    console.error('创建户籍信息错误:', error);
    if (error.message === '该身份证号已存在户籍记录') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const updateHousehold = async (req, res) => {
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
    const updateData = req.body;

    const household = store.findHouseholdById(id);
    if (!household) {
      return res.status(404).json({
        success: false,
        message: '户籍信息不存在'
      });
    }

    const oldValue = JSON.stringify({
      name: household.name,
      idCard: household.idCard,
      gender: household.gender,
      age: household.age,
      currentAddress: household.currentAddress,
      householdAddress: household.householdAddress,
      status: household.status
    });

    const updatedHousehold = store.updateHousehold(id, updateData);

    const newValue = JSON.stringify({
      name: updatedHousehold.name,
      idCard: updatedHousehold.idCard,
      gender: updatedHousehold.gender,
      age: updatedHousehold.age,
      currentAddress: updatedHousehold.currentAddress,
      householdAddress: updatedHousehold.householdAddress,
      status: updatedHousehold.status
    });

    try {
      store.createOperationLog({
        userId: req.user.id,
        username: req.user.username,
        operationType: store.OPERATION_TYPES.UPDATE,
        targetType: 'household',
        targetId: updatedHousehold.id,
        targetName: updatedHousehold.name,
        oldValue,
        newValue,
        description: `修改户籍信息: ${updatedHousehold.name}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('记录操作日志失败:', logError.message);
    }

    res.json({
      success: true,
      message: '户籍信息更新成功',
      data: { household: updatedHousehold }
    });
  } catch (error) {
    console.error('更新户籍信息错误:', error);
    if (error.message === '该身份证号已存在其他户籍记录') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const moveInHousehold = async (req, res) => {
  try {
    const { id } = req.params;
    const { newAddress, reason, note } = req.body;

    const household = store.findHouseholdById(id);
    if (!household) {
      return res.status(404).json({
        success: false,
        message: '户籍信息不存在'
      });
    }

    const oldValue = JSON.stringify({
      currentAddress: household.currentAddress,
      householdAddress: household.householdAddress,
      status: household.status
    });

    const oldAddress = household.currentAddress;
    const updatedHousehold = store.updateHousehold(id, {
      currentAddress: newAddress,
      status: store.HOUSEHOLD_STATUS.ACTIVE,
      note: (household.note || '') + `\n[迁入记录] 从 ${oldAddress} 迁入 ${newAddress}，原因：${reason || '无'}。时间：${new Date().toLocaleString()}`
    });

    const newValue = JSON.stringify({
      currentAddress: updatedHousehold.currentAddress,
      householdAddress: updatedHousehold.householdAddress,
      status: updatedHousehold.status
    });

    try {
      store.createOperationLog({
        userId: req.user.id,
        username: req.user.username,
        operationType: store.OPERATION_TYPES.MOVE_IN,
        targetType: 'household',
        targetId: updatedHousehold.id,
        targetName: updatedHousehold.name,
        oldValue,
        newValue,
        description: `户籍迁入: ${updatedHousehold.name}，从 ${oldAddress} 到 ${newAddress}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('记录操作日志失败:', logError.message);
    }

    res.json({
      success: true,
      message: '户籍迁入成功',
      data: { household: updatedHousehold }
    });
  } catch (error) {
    console.error('户籍迁入错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const moveOutHousehold = async (req, res) => {
  try {
    const { id } = req.params;
    const { destination, reason, note } = req.body;

    const household = store.findHouseholdById(id);
    if (!household) {
      return res.status(404).json({
        success: false,
        message: '户籍信息不存在'
      });
    }

    const oldValue = JSON.stringify({
      currentAddress: household.currentAddress,
      status: household.status
    });

    const oldAddress = household.currentAddress;
    const updatedHousehold = store.updateHousehold(id, {
      status: store.HOUSEHOLD_STATUS.MOVED,
      note: (household.note || '') + `\n[迁出记录] 从 ${oldAddress} 迁出到 ${destination}，原因：${reason || '无'}。时间：${new Date().toLocaleString()}`
    });

    const newValue = JSON.stringify({
      currentAddress: updatedHousehold.currentAddress,
      status: updatedHousehold.status
    });

    try {
      store.createOperationLog({
        userId: req.user.id,
        username: req.user.username,
        operationType: store.OPERATION_TYPES.MOVE_OUT,
        targetType: 'household',
        targetId: updatedHousehold.id,
        targetName: updatedHousehold.name,
        oldValue,
        newValue,
        description: `户籍迁出: ${updatedHousehold.name}，从 ${oldAddress} 到 ${destination}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('记录操作日志失败:', logError.message);
    }

    res.json({
      success: true,
      message: '户籍迁出成功',
      data: { household: updatedHousehold }
    });
  } catch (error) {
    console.error('户籍迁出错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const cancelHousehold = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, note } = req.body;

    const household = store.findHouseholdById(id);
    if (!household) {
      return res.status(404).json({
        success: false,
        message: '户籍信息不存在'
      });
    }

    const oldValue = JSON.stringify({
      status: household.status
    });

    const updatedHousehold = store.updateHousehold(id, {
      status: store.HOUSEHOLD_STATUS.DELETED,
      note: (household.note || '') + `\n[注销记录] 原因：${reason || '无'}。${note || ''} 时间：${new Date().toLocaleString()}`
    });

    const newValue = JSON.stringify({
      status: updatedHousehold.status
    });

    try {
      store.createOperationLog({
        userId: req.user.id,
        username: req.user.username,
        operationType: store.OPERATION_TYPES.DELETE,
        targetType: 'household',
        targetId: updatedHousehold.id,
        targetName: updatedHousehold.name,
        oldValue,
        newValue,
        description: `户籍注销: ${updatedHousehold.name}，原因：${reason || '无'}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('记录操作日志失败:', logError.message);
    }

    res.json({
      success: true,
      message: '户籍注销成功',
      data: { household: updatedHousehold }
    });
  } catch (error) {
    console.error('户籍注销错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const getStatistics = async (req, res) => {
  try {
    const result = store.getHouseholdStatistics();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

module.exports = {
  getAllHouseholds,
  getHouseholdById,
  searchHousehold,
  createHousehold,
  updateHousehold,
  moveInHousehold,
  moveOutHousehold,
  cancelHousehold,
  getStatistics
};
