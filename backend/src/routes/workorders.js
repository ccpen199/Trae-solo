const express = require('express');
const WorkOrder = require('../models/WorkOrder');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const { authenticateAdmin, requireRole } = require('../middleware/auth');
const { generateWorkOrderId } = require('../utils/generateId');

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, priority, orderType, assigneeId, startDate, endDate, deviceId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (orderType) query.orderType = orderType;
    if (assigneeId) query.assigneeId = assigneeId;
    if (deviceId) query.deviceId = deviceId;
    if (startDate) query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };

    const workOrders = await WorkOrder.find(query)
      .populate('assigneeId', 'name')
      .populate('createdBy', 'name')
      .populate('sourceAlertId', 'alertId title')
      .populate('deviceInfo.buildingId', 'buildingName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WorkOrder.countDocuments(query);

    res.json({
      success: true,
      data: {
        workOrders,
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
    const { startDate, endDate, assigneeId } = req.query;
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);
    const query = Object.keys(dateQuery).length > 0 ? { createdAt: dateQuery } : {};
    if (assigneeId) query.assigneeId = assigneeId;

    const total = await WorkOrder.countDocuments(query);
    const pending = await WorkOrder.countDocuments({ ...query, status: 'pending' });
    const inProgress = await WorkOrder.countDocuments({ ...query, status: 'in_progress' });
    const completed = await WorkOrder.countDocuments({ ...query, status: 'completed' });
    const urgent = await WorkOrder.countDocuments({ ...query, priority: 'urgent', status: { $ne: 'completed' } });

    const slaBreached = await WorkOrder.countDocuments({
      ...query,
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() },
      slaBreached: false
    });

    const typeStats = await WorkOrder.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 },
          avgActualTime: { $avg: '$actualTime' }
        }
      }
    ]);

    const assigneeStats = await WorkOrder.aggregate([
      { $match: { ...query, status: 'completed', assigneeName: { $exists: true } } },
      {
        $group: {
          _id: '$assigneeName',
          count: { $sum: 1 },
          avgTime: { $avg: '$actualTime' },
          totalCost: { $sum: '$totalCost' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const monthlyStats = await WorkOrder.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 6 }
    ]);

    res.json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        completed,
        urgent,
        slaBreached,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
        typeStats,
        assigneeStats,
        monthlyStats: monthlyStats.reverse()
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate('assigneeId', 'name phone')
      .populate('createdBy', 'name')
      .populate('sourceAlertId', 'alertId title description')
      .populate('deviceInfo.buildingId', 'buildingName');

    if (!workOrder) {
      return res.status(404).json({ success: false, message: '工单不存在' });
    }

    res.json({
      success: true,
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operator'), async (req, res, next) => {
  try {
    const { orderType, priority, deviceId, title, description, assigneeId, assigneeName, dueDate } = req.body;

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(400).json({ success: false, message: '设备不存在' });
    }

    const workOrderId = generateWorkOrderId();
    const workOrder = new WorkOrder({
      workOrderId,
      orderType,
      priority: priority || 'medium',
      deviceId,
      deviceInfo: {
        deviceName: device.deviceName,
        location: device.location,
        buildingId: device.buildingId,
        floor: device.floor,
        faultCode: device.faultCode,
        faultMessage: device.faultMessage
      },
      title,
      description,
      triggerSource: 'manual',
      assigneeId,
      assigneeName,
      status: assigneeId ? 'assigned' : 'pending',
      assignedAt: assigneeId ? Date.now() : undefined,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdBy: req.admin._id
    });

    await workOrder.save();

    if (assigneeId && deviceId) {
      await Device.findOneAndUpdate(
        { deviceId },
        { status: 'maintenance', updatedAt: Date.now() }
      );
    }

    res.status(201).json({
      success: true,
      message: '工单创建成功',
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operator'), async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!workOrder) {
      return res.status(404).json({ success: false, message: '工单不存在' });
    }

    res.json({
      success: true,
      message: '工单更新成功',
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/assign', authenticateAdmin, requireRole('super_admin', 'admin', 'operator'), async (req, res, next) => {
  try {
    const { assigneeId, assigneeName } = req.body;
    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return res.status(404).json({ success: false, message: '工单不存在' });
    }

    workOrder.assigneeId = assigneeId;
    workOrder.assigneeName = assigneeName;
    workOrder.status = 'assigned';
    workOrder.assignedAt = Date.now();
    workOrder.updatedAt = Date.now();
    await workOrder.save();

    if (workOrder.deviceId) {
      await Device.findOneAndUpdate(
        { deviceId: workOrder.deviceId },
        { status: 'maintenance', updatedAt: Date.now() }
      );
    }

    res.json({
      success: true,
      message: '工单已分配',
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/start', authenticateAdmin, async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return res.status(404).json({ success: false, message: '工单不存在' });
    }

    if (workOrder.status !== 'assigned') {
      return res.status(400).json({ success: false, message: '工单状态不允许开始' });
    }

    workOrder.status = 'in_progress';
    workOrder.startedAt = Date.now();
    workOrder.updatedAt = Date.now();
    await workOrder.save();

    res.json({
      success: true,
      message: '工单已开始处理',
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/complete', authenticateAdmin, async (req, res, next) => {
  try {
    const { resolution, actualTime, partsUsed, inspectionItems, images } = req.body;
    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return res.status(404).json({ success: false, message: '工单不存在' });
    }

    if (workOrder.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: '工单状态不允许完成' });
    }

    workOrder.status = 'completed';
    workOrder.resolution = resolution;
    workOrder.actualTime = actualTime;
    workOrder.partsUsed = partsUsed;
    workOrder.inspectionItems = inspectionItems;
    workOrder.images = images;
    workOrder.completedAt = Date.now();
    workOrder.totalCost = partsUsed?.reduce((sum, p) => sum + (p.cost || 0), 0) || 0;
    workOrder.updatedAt = Date.now();
    await workOrder.save();

    if (workOrder.deviceId) {
      await Device.findOneAndUpdate(
        { deviceId: workOrder.deviceId },
        { 
          status: 'online', 
          faultCode: undefined, 
          faultMessage: undefined,
          lastMaintenanceDate: Date.now(),
          $inc: { maintenanceCount: 1 },
          updatedAt: Date.now()
        }
      );
    }

    if (workOrder.sourceAlertId) {
      await Alert.findByIdAndUpdate(
        workOrder.sourceAlertId,
        {
          status: 'resolved',
          resolvedBy: req.admin._id,
          resolvedAt: Date.now(),
          resolution: resolution,
          updatedAt: Date.now()
        }
      );
    }

    res.json({
      success: true,
      message: '工单已完成',
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return res.status(404).json({ success: false, message: '工单不存在' });
    }

    if (workOrder.status === 'completed') {
      return res.status(400).json({ success: false, message: '已完成的工单不能取消' });
    }

    workOrder.status = 'cancelled';
    workOrder.resolution = reason;
    workOrder.updatedAt = Date.now();
    await workOrder.save();

    if (workOrder.deviceId) {
      await Device.findOneAndUpdate(
        { deviceId: workOrder.deviceId },
        { status: 'online', updatedAt: Date.now() }
      );
    }

    res.json({
      success: true,
      message: '工单已取消'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
