const express = require('express');
const Device = require('../models/Device');
const DeviceHeartbeat = require('../models/DeviceHeartbeat');
const DormitoryBuilding = require('../models/DormitoryBuilding');
const { authenticateAdmin, requireRole, authenticateDevice } = require('../middleware/auth');
const { generateDeviceId } = require('../utils/generateId');

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, buildingId, deviceType, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (buildingId) query.buildingId = buildingId;
    if (deviceType) query.deviceType = deviceType;
    if (search) {
      query.$or = [
        { deviceId: { $regex: search, $options: 'i' } },
        { deviceName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const devices = await Device.find(query)
      .populate('buildingId', 'buildingName buildingType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Device.countDocuments(query);

    res.json({
      success: true,
      data: {
        devices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/statistics', authenticateAdmin, async (req, res, next) => {
  try {
    const stats = await Device.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Device.aggregate([
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Device.countDocuments();
    const online = await Device.countDocuments({ status: 'online' });
    const offline = await Device.countDocuments({ status: 'offline' });
    const fault = await Device.countDocuments({ status: 'fault' });
    const maintenance = await Device.countDocuments({ status: 'maintenance' });
    const sleep = await Device.countDocuments({ status: 'sleep' });

    const buildingStats = await Device.aggregate([
      {
        $lookup: {
          from: 'dormitorybuildings',
          localField: 'buildingId',
          foreignField: '_id',
          as: 'building'
        }
      },
      { $unwind: '$building' },
      {
        $group: {
          _id: '$buildingId',
          buildingName: { $first: '$building.buildingName' },
          total: { $sum: 1 },
          online: { $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] } },
          fault: { $sum: { $cond: [{ $eq: ['$status', 'fault'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total,
        online,
        offline,
        fault,
        maintenance,
        sleep,
        onlineRate: total > 0 ? ((online / total) * 100).toFixed(1) : 0,
        faultRate: total > 0 ? ((fault / total) * 100).toFixed(2) : 0,
        statusStats: stats,
        typeStats,
        buildingStats
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('buildingId', 'buildingName buildingType managerName managerPhone');

    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    const recentHeartbeats = await DeviceHeartbeat.find({ deviceId: device.deviceId })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        device,
        recentHeartbeats
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operator'), async (req, res, next) => {
  try {
    const { deviceName, deviceType, buildingId, floor, roomNumber, location, 
            manufacturer, modelNumber, nbIotImei, simCardNumber } = req.body;

    const building = await DormitoryBuilding.findById(buildingId);
    if (!building) {
      return res.status(400).json({ success: false, message: '宿舍楼不存在' });
    }

    const deviceId = generateDeviceId();
    
    const device = new Device({
      deviceId,
      deviceName,
      deviceType,
      buildingId,
      floor,
      roomNumber,
      location,
      manufacturer,
      modelNumber,
      nbIotImei,
      simCardNumber
    });

    await device.save();

    building.deviceCount += 1;
    await building.save();

    res.status(201).json({
      success: true,
      message: '设备创建成功',
      data: device
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operator'), async (req, res, next) => {
  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    res.json({
      success: true,
      message: '设备更新成功',
      data: device
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    await DormitoryBuilding.findByIdAndUpdate(
      device.buildingId,
      { $inc: { deviceCount: -1 } }
    );

    await device.deleteOne();

    res.json({
      success: true,
      message: '设备删除成功'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/command', authenticateAdmin, async (req, res, next) => {
  try {
    const { command, params } = req.body;
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    if (device.status !== 'online') {
      return res.status(400).json({ success: false, message: '设备不在线' });
    }

    res.json({
      success: true,
      message: '命令已发送',
      data: {
        command,
        params,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/sleep', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      {
        status: 'sleep',
        isSleepMode: true,
        sleepSchedule: {
          enabled: true,
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    res.json({
      success: true,
      message: '设备已设置为休眠模式',
      data: device
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/wakeup', authenticateAdmin, requireRole('super_admin', 'admin', 'operator'), async (req, res, next) => {
  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      {
        status: 'online',
        isSleepMode: false,
        sleepSchedule: { enabled: false },
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    res.json({
      success: true,
      message: '设备已唤醒',
      data: device
    });
  } catch (error) {
    next(error);
  }
});

router.post('/batch/sleep', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { deviceIds, startDate, endDate } = req.body;

    const result = await Device.updateMany(
      { _id: { $in: deviceIds } },
      {
        status: 'sleep',
        isSleepMode: true,
        sleepSchedule: {
          enabled: true,
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        updatedAt: Date.now()
      }
    );

    res.json({
      success: true,
      message: `成功将 ${result.modifiedCount} 台设备设置为休眠模式`
    });
  } catch (error) {
    next(error);
  }
});

router.post('/iot/heartbeat', authenticateDevice, async (req, res, next) => {
  try {
    const device = req.device;
    const { signalStrength, temperature, batteryLevel, valveStatus, flowRate, 
            totalWaterUsage, status, faultCode, faultMessage, firmwareVersion } = req.body;

    const heartbeat = new DeviceHeartbeat({
      deviceId: device.deviceId,
      signalStrength,
      temperature,
      batteryLevel,
      valveStatus,
      flowRate,
      totalWaterUsage,
      status,
      faultCode,
      faultMessage,
      firmwareVersion,
      upstreamData: req.body
    });
    await heartbeat.save();

    device.lastHeartbeat = Date.now();
    device.status = status === 'error' ? 'fault' : 'online';
    device.signalStrength = signalStrength;
    device.valveStatus = valveStatus;
    device.currentFlowRate = flowRate || 0;
    device.currentTemperature = temperature;
    device.totalWaterUsage = totalWaterUsage || device.totalWaterUsage;

    if (faultCode) {
      device.faultCode = faultCode;
      device.faultMessage = faultMessage;
      device.status = 'fault';
    }

    if (firmwareVersion) {
      device.firmwareVersion = firmwareVersion;
    }

    device.updatedAt = Date.now();
    await device.save();

    const response = {
      code: 200,
      message: '心跳上报成功',
      timestamp: Date.now(),
      commands: []
    };

    if (device.targetFirmwareVersion && device.firmwareVersion !== device.targetFirmwareVersion) {
      response.commands.push({
        type: 'ota',
        version: device.targetFirmwareVersion,
        url: `/api/ota/firmware/${device.targetFirmwareVersion}`,
        md5: 'mock-md5-checksum'
      });
    }

    if (device.isSleepMode) {
      response.commands.push({
        type: 'sleep',
        duration: 3600
      });
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
