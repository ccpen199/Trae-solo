const express = require('express');
const OTARecord = require('../models/OTARecord');
const Device = require('../models/Device');
const { authenticateAdmin, requireRole } = require('../middleware/auth');
const { generateOTAId } = require('../utils/generateId');

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, firmwareVersion } = req.query;
    const query = {};

    if (status) query.status = status;
    if (firmwareVersion) query.firmwareVersion = firmwareVersion;

    const records = await OTARecord.find(query)
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await OTARecord.countDocuments(query);

    res.json({
      success: true,
      data: {
        records,
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

router.get('/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const record = await OTARecord.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name');

    if (!record) {
      return res.status(404).json({ success: false, message: 'OTA记录不存在' });
    }

    const deviceDetails = await Promise.all(
      record.targetDevices.map(async (td) => {
        const device = await Device.findOne({ deviceId: td.deviceId }, 'deviceName status buildingId floor');
        return { ...td.toObject(), deviceInfo: device };
      })
    );

    res.json({
      success: true,
      data: {
        ...record.toObject(),
        targetDevices: deviceDetails
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { firmwareVersion, previousVersion, firmwareUrl, firmwareSize, md5Checksum, 
            releaseNotes, targetDeviceIds, upgradeStrategy, batchSize, scheduledTime, forceUpgrade } = req.body;

    const existing = await OTARecord.findOne({ firmwareVersion, status: { $in: ['draft', 'scheduled', 'in_progress'] } });
    if (existing) {
      return res.status(400).json({ success: false, message: '该版本已有进行中的升级任务' });
    }

    const otaId = generateOTAId();
    const targetDevices = targetDeviceIds.map(deviceId => ({
      deviceId,
      status: 'pending',
      progress: 0
    }));

    const otaRecord = new OTARecord({
      otaId,
      firmwareVersion,
      previousVersion,
      firmwareUrl,
      firmwareSize,
      md5Checksum,
      releaseNotes,
      targetDevices,
      totalDevices: targetDeviceIds.length,
      upgradeStrategy,
      batchSize: batchSize || 10,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      forceUpgrade: forceUpgrade || false,
      createdBy: req.admin._id,
      status: scheduledTime ? 'scheduled' : 'draft'
    });

    await otaRecord.save();

    res.status(201).json({
      success: true,
      message: 'OTA升级任务创建成功',
      data: otaRecord
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/approve', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res, next) => {
  try {
    const otaRecord = await OTARecord.findById(req.params.id);

    if (!otaRecord) {
      return res.status(404).json({ success: false, message: 'OTA记录不存在' });
    }

    if (otaRecord.status !== 'draft' && otaRecord.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: '该任务状态不允许审批' });
    }

    otaRecord.status = 'in_progress';
    otaRecord.approvedBy = req.admin._id;
    otaRecord.approvedAt = Date.now();
    otaRecord.startedAt = Date.now();
    otaRecord.updatedAt = Date.now();
    await otaRecord.save();

    await Device.updateMany(
      { deviceId: { $in: otaRecord.targetDevices.map(d => d.deviceId) } },
      { 
        targetFirmwareVersion: otaRecord.firmwareVersion,
        otaStatus: 'downloading',
        updatedAt: Date.now()
      }
    );

    res.json({
      success: true,
      message: 'OTA升级任务已批准并开始执行',
      data: otaRecord
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res, next) => {
  try {
    const otaRecord = await OTARecord.findById(req.params.id);

    if (!otaRecord) {
      return res.status(404).json({ success: false, message: 'OTA记录不存在' });
    }

    if (otaRecord.status === 'completed') {
      return res.status(400).json({ success: false, message: '已完成的任务不能取消' });
    }

    otaRecord.status = 'cancelled';
    otaRecord.updatedAt = Date.now();
    otaRecord.targetDevices.forEach(d => {
      if (d.status === 'pending' || d.status === 'downloading') {
        d.status = 'cancelled';
      }
    });
    await otaRecord.save();

    await Device.updateMany(
      { deviceId: { $in: otaRecord.targetDevices.filter(d => d.status === 'cancelled').map(d => d.deviceId) } },
      { 
        targetFirmwareVersion: undefined,
        otaStatus: 'idle',
        updatedAt: Date.now()
      }
    );

    res.json({
      success: true,
      message: 'OTA升级任务已取消'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/device/progress', async (req, res, next) => {
  try {
    const { deviceId, otaId, status, progress, errorMessage, firmwareVersion } = req.body;

    const otaRecord = await OTARecord.findOne({ otaId });
    if (!otaRecord) {
      return res.status(404).json({ success: false, message: 'OTA任务不存在' });
    }

    const targetDevice = otaRecord.targetDevices.find(d => d.deviceId === deviceId);
    if (!targetDevice) {
      return res.status(404).json({ success: false, message: '设备不在升级列表中' });
    }

    targetDevice.status = status;
    targetDevice.progress = progress;
    if (status === 'downloading' || status === 'updating') {
      targetDevice.startedAt = targetDevice.startedAt || Date.now();
    }
    if (status === 'success' || status === 'failed') {
      targetDevice.completedAt = Date.now();
      if (status === 'success') {
        otaRecord.successCount += 1;
      } else {
        otaRecord.failedCount += 1;
        targetDevice.errorMessage = errorMessage;
      }
    }

    const allCompleted = otaRecord.targetDevices.every(d => 
      ['success', 'failed', 'cancelled'].includes(d.status)
    );

    if (allCompleted) {
      otaRecord.status = 'completed';
      otaRecord.completedAt = Date.now();
    }

    otaRecord.updatedAt = Date.now();
    await otaRecord.save();

    await Device.findOneAndUpdate(
      { deviceId },
      {
        otaStatus: status === 'success' ? 'idle' : status,
        otaProgress: progress,
        firmwareVersion: status === 'success' ? firmwareVersion : undefined,
        targetFirmwareVersion: status === 'success' ? undefined : otaRecord.targetFirmwareVersion,
        updatedAt: Date.now()
      }
    );

    res.json({
      success: true,
      message: '进度已更新'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/firmware/:version', (req, res) => {
  res.json({
    version: req.params.version,
    url: `/firmware/${req.params.version}.bin`,
    md5: 'mock-md5-checksum',
    size: 1024000,
    releaseNotes: '修复已知问题，提升稳定性'
  });
});

module.exports = router;
