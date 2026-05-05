const { HandheldDevice, User, Department, OperationLog } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const { redis } = require('../config/redis');

const getDevices = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, operationMode, status, departmentId } = req.query;
    const offset = (page - 1) * pageSize;
    
    const where = {};
    
    if (keyword) {
      where[Op.or] = [
        { deviceId: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } },
        { macAddress: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (operationMode) {
      where.operationMode = operationMode;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    const { count, rows } = await HandheldDevice.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'realName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getDeviceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const device = await HandheldDevice.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'realName']
        }
      ]
    });
    
    if (!device) {
      throw new AppError('设备不存在', 404);
    }
    
    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    next(error);
  }
};

const createDevice = async (req, res, next) => {
  try {
    const {
      deviceId, name, deviceType, macAddress, ipAddress,
      operationMode, departmentId, assignedUserId, location, remark
    } = req.body;
    
    if (!deviceId || !name) {
      throw new AppError('设备编号和名称不能为空', 400);
    }
    
    const existingDevice = await HandheldDevice.findOne({ where: { deviceId } });
    if (existingDevice) {
      throw new AppError('设备编号已存在', 400);
    }
    
    const device = await HandheldDevice.create({
      deviceId,
      name,
      deviceType,
      macAddress,
      ipAddress,
      operationMode: operationMode || 'all',
      departmentId,
      assignedUserId,
      location,
      remark,
      status: 'inactive'
    });
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'device',
      action: 'create',
      targetId: device.id,
      targetType: 'HandheldDevice',
      description: `创建设备：${deviceId} - ${name}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '设备创建成功',
      data: device
    });
  } catch (error) {
    next(error);
  }
};

const updateDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const device = await HandheldDevice.findByPk(id);
    
    if (!device) {
      throw new AppError('设备不存在', 404);
    }
    
    if (updateData.deviceId && updateData.deviceId !== device.deviceId) {
      const existingDevice = await HandheldDevice.findOne({ 
        where: { deviceId: updateData.deviceId, id: { [Op.ne]: id } } 
      });
      if (existingDevice) {
        throw new AppError('设备编号已存在', 400);
      }
    }
    
    const allowedFields = [
      'name', 'deviceType', 'macAddress', 'ipAddress',
      'operationMode', 'departmentId', 'assignedUserId',
      'location', 'remark', 'status'
    ];
    
    const filteredUpdate = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field];
      }
    }
    
    await device.update(filteredUpdate);
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'device',
      action: 'update',
      targetId: device.id,
      targetType: 'HandheldDevice',
      description: `更新设备：${device.deviceId}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '设备更新成功'
    });
  } catch (error) {
    next(error);
  }
};

const deleteDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const device = await HandheldDevice.findByPk(id);
    
    if (!device) {
      throw new AppError('设备不存在', 404);
    }
    
    const deviceId = device.deviceId;
    const name = device.name;
    await device.destroy();
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'device',
      action: 'delete',
      targetId: id,
      targetType: 'HandheldDevice',
      description: `删除设备：${deviceId} - ${name}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '设备删除成功'
    });
  } catch (error) {
    next(error);
  }
};

const deviceRegister = async (req, res, next) => {
  try {
    const { deviceId, deviceType, macAddress, ipAddress } = req.body;
    
    if (!deviceId) {
      throw new AppError('设备编号不能为空', 400);
    }
    
    let device = await HandheldDevice.findOne({ where: { deviceId } });
    
    if (!device) {
      throw new AppError('设备未注册，请联系管理员', 404);
    }
    
    device.status = 'active';
    device.lastHeartbeatAt = new Date();
    device.deviceType = deviceType || device.deviceType;
    device.macAddress = macAddress || device.macAddress;
    device.ipAddress = ipAddress || device.ipAddress;
    
    await device.save();
    
    const deviceKey = `device:${deviceId}`;
    await redis.hset(deviceKey, {
      id: device.id,
      deviceId: device.deviceId,
      name: device.name,
      operationMode: device.operationMode,
      departmentId: device.departmentId || '',
      status: 'active',
      lastHeartbeat: Date.now().toString()
    });
    await redis.expire(deviceKey, 3600);
    
    res.json({
      success: true,
      message: '设备注册成功',
      data: {
        id: device.id,
        deviceId: device.deviceId,
        name: device.name,
        operationMode: device.operationMode
      }
    });
  } catch (error) {
    next(error);
  }
};

const deviceHeartbeat = async (req, res, next) => {
  try {
    const { deviceId, batteryLevel, ipAddress } = req.body;
    
    if (!deviceId) {
      throw new AppError('设备编号不能为空', 400);
    }
    
    const device = await HandheldDevice.findOne({ where: { deviceId } });
    
    if (!device) {
      throw new AppError('设备不存在', 404);
    }
    
    device.lastHeartbeatAt = new Date();
    device.status = 'active';
    if (batteryLevel !== undefined) {
      device.batteryLevel = batteryLevel;
    }
    if (ipAddress) {
      device.ipAddress = ipAddress;
    }
    
    await device.save();
    
    const deviceKey = `device:${deviceId}`;
    await redis.hset(deviceKey, {
      status: 'active',
      lastHeartbeat: Date.now().toString(),
      batteryLevel: batteryLevel || ''
    });
    await redis.expire(deviceKey, 3600);
    
    res.json({
      success: true,
      message: '心跳成功',
      data: {
        serverTime: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

const getDeviceStatus = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    
    const device = await HandheldDevice.findOne({ where: { deviceId } });
    
    if (!device) {
      throw new AppError('设备不存在', 404);
    }
    
    const deviceKey = `device:${deviceId}`;
    const cachedInfo = await redis.hgetall(deviceKey);
    
    res.json({
      success: true,
      data: {
        id: device.id,
        deviceId: device.deviceId,
        name: device.name,
        operationMode: device.operationMode,
        status: device.status,
        lastHeartbeatAt: device.lastHeartbeatAt,
        batteryLevel: device.batteryLevel,
        cached: cachedInfo || null
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  deviceRegister,
  deviceHeartbeat,
  getDeviceStatus
};
