const express = require('express');
const Alert = require('../models/Alert');
const WorkOrder = require('../models/WorkOrder');
const Device = require('../models/Device');
const { authenticateAdmin, requireRole } = require('../middleware/auth');
const { generateAlertId, generateWorkOrderId } = require('../utils/generateId');

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, severity, alertType, startDate, endDate, deviceId, studentId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (alertType) query.alertType = alertType;
    if (deviceId) query.deviceId = deviceId;
    if (studentId) query.studentId = studentId;
    if (startDate) query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };

    const alerts = await Alert.find(query)
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')
      .populate('relatedWorkOrderId', 'orderId status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Alert.countDocuments(query);

    res.json({
      success: true,
      data: {
        alerts,
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
    const { startDate, endDate } = req.query;
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);
    const query = Object.keys(dateQuery).length > 0 ? { createdAt: dateQuery } : {};

    const total = await Alert.countDocuments(query);
    const newAlerts = await Alert.countDocuments({ ...query, status: 'new' });
    const processing = await Alert.countDocuments({ ...query, status: 'processing' });
    const resolved = await Alert.countDocuments({ ...query, status: 'resolved' });

    const severityStats = await Alert.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Alert.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$alertType',
          count: { $sum: 1 }
        }
      }
    ]);

    const dailyStats = await Alert.aggregate([
      { $match: { ...query, status: { $in: ['new', 'acknowledged', 'processing'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 14 }
    ]);

    const topDeviceAlerts = await Alert.aggregate([
      { $match: { ...query, deviceId: { $exists: true } } },
      {
        $group: {
          _id: '$deviceId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        total,
        new: newAlerts,
        processing,
        resolved,
        resolveRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0,
        severityStats,
        typeStats,
        dailyStats: dailyStats.reverse(),
        topDeviceAlerts
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')
      .populate('relatedWorkOrderId', 'orderId status assigneeName')
      .populate('buildingId', 'buildingName');

    if (!alert) {
      return res.status(404).json({ success: false, message: '告警不存在' });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/acknowledge', authenticateAdmin, async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: '告警不存在' });
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = req.admin._id;
    alert.acknowledgedAt = Date.now();
    alert.updatedAt = Date.now();
    await alert.save();

    res.json({
      success: true,
      message: '告警已确认',
      data: alert
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/resolve', authenticateAdmin, async (req, res, next) => {
  try {
    const { resolution } = req.body;
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, message: '告警不存在' });
    }

    alert.status = 'resolved';
    alert.resolvedBy = req.admin._id;
    alert.resolvedAt = Date.now();
    alert.resolution = resolution;
    alert.updatedAt = Date.now();
    await alert.save();

    if (alert.deviceId) {
      await Device.findOneAndUpdate(
        { deviceId: alert.deviceId },
        { status: 'online', faultCode: undefined, faultMessage: undefined, updatedAt: Date.now() }
      );
    }

    res.json({
      success: true,
      message: '告警已解决',
      data: alert
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/create-workorder', authenticateAdmin, async (req, res, next) => {
  try {
    const { priority, assigneeId, assigneeName, description } = req.body;
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, message: '告警不存在' });
    }

    const device = await Device.findOne({ deviceId: alert.deviceId });

    const workOrderId = generateWorkOrderId();
    const workOrder = new WorkOrder({
      orderId: workOrderId,
      orderType: 'repair',
      priority: priority || 'high',
      status: 'pending',
      deviceId: alert.deviceId,
      deviceInfo: device ? {
        deviceName: device.deviceName,
        location: device.location,
        buildingId: device.buildingId,
        floor: device.floor,
        faultCode: device.faultCode,
        faultMessage: device.faultMessage
      } : undefined,
      title: alert.title,
      description: description || alert.description,
      triggerSource: 'alert',
      sourceAlertId: alert._id,
      assigneeId,
      assigneeName,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdBy: req.admin._id
    });

    await workOrder.save();

    alert.status = 'processing';
    alert.relatedWorkOrderId = workOrder._id;
    alert.updatedAt = Date.now();
    await alert.save();

    res.json({
      success: true,
      message: '工单已创建',
      data: {
        workOrderId,
        workOrder
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/ignore', authenticateAdmin, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, message: '告警不存在' });
    }

    alert.status = 'ignored';
    alert.resolution = reason;
    alert.updatedAt = Date.now();
    await alert.save();

    res.json({
      success: true,
      message: '告警已忽略'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/batch/acknowledge', authenticateAdmin, async (req, res, next) => {
  try {
    const { alertIds } = req.body;

    const result = await Alert.updateMany(
      { _id: { $in: alertIds }, status: 'new' },
      {
        status: 'acknowledged',
        acknowledgedBy: req.admin._id,
        acknowledgedAt: Date.now(),
        updatedAt: Date.now()
      }
    );

    res.json({
      success: true,
      message: `成功确认 ${result.modifiedCount} 条告警`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
