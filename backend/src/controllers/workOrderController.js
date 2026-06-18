const { WorkOrder, Device, User, FunnelEvent, Grid } = require('../models');
const { generateWorkOrderNo } = require('../utils/order');

exports.getWorkOrders = async (req, res, next) => {
  try {
    const { status, type, priority, assigneeId, deviceId, page = 1, pageSize = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.assigneeId = assigneeId;
    if (deviceId) filter.deviceId = deviceId;

    if (req.user.role === 'property') {
      filter.communityId = req.user.communityId;
    }

    const workOrders = await WorkOrder.find(filter)
      .populate('deviceId', 'deviceCode name deviceType location')
      .populate('reporterId', 'nickname phone')
      .populate('assigneeId', 'nickname phone')
      .populate('communityId', 'name')
      .populate('gridId', 'name')
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .sort({ priority: 1, createdAt: -1 });

    const total = await WorkOrder.countDocuments(filter);

    const stats = {
      total,
      pending: await WorkOrder.countDocuments({ ...filter, status: 'pending' }),
      processing: await WorkOrder.countDocuments({ ...filter, status: 'processing' }),
      completed: await WorkOrder.countDocuments({ ...filter, status: 'completed' }),
      highPriority: await WorkOrder.countDocuments({ ...filter, priority: { $in: ['high', 'urgent'] } }),
    };

    res.json({
      success: true,
      data: {
        list: workOrders,
        pagination: { page: Number(page), pageSize: Number(pageSize), total },
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getWorkOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workOrder = await WorkOrder.findById(id)
      .populate('deviceId', 'deviceCode name deviceType location')
      .populate('reporterId', 'nickname phone')
      .populate('assigneeId', 'nickname phone')
      .populate('communityId', 'name')
      .populate('gridId', 'name');

    if (!workOrder) {
      return res.status(404).json({ message: '工单不存在' });
    }

    res.json({
      success: true,
      data: workOrder,
    });
  } catch (error) {
    next(error);
  }
};

exports.createWorkOrder = async (req, res, next) => {
  try {
    const { deviceId, type, priority = 'medium', title, description, faultCode, images } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }

    device.faultCount = (device.faultCount || 0) + 1;
    if (type === 'fault') {
      device.status = 'faulty';
      device.workingStatus = 'paused';
    }
    await device.save();

    const workOrder = await WorkOrder.create({
      orderNo: generateWorkOrderNo(),
      type,
      priority,
      deviceId,
      gridId: device.gridId,
      communityId: device.communityId,
      reporterId: req.user._id,
      reporterName: req.user.nickname,
      reporterPhone: req.user.phone,
      title,
      description,
      faultCode,
      images,
      status: 'pending',
      auditLog: [{
        action: 'created',
        operatorId: req.user._id,
        operatorName: req.user.nickname,
        timestamp: new Date(),
        note: '工单已创建',
      }],
    });

    if (type === 'fault' && req.user.role === 'resident') {
      await FunnelEvent.create({
        userId: req.user._id,
        event: 'report_fault',
        deviceId,
        deviceType: device.deviceType,
        communityId: device.communityId,
        source: req.headers['source'] || 'web',
        metadata: { workOrderId: workOrder._id, faultCode },
      });
    }

    res.status(201).json({
      success: true,
      data: workOrder,
    });
  } catch (error) {
    next(error);
  }
};

exports.assignWorkOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assigneeId, estimatedTime } = req.body;

    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) {
      return res.status(404).json({ message: '工单不存在' });
    }

    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      return res.status(404).json({ message: '处理人不存在' });
    }

    workOrder.assigneeId = assigneeId;
    workOrder.status = 'assigned';
    workOrder.estimatedTime = estimatedTime;
    workOrder.auditLog.push({
      action: 'assigned',
      operatorId: req.user._id,
      operatorName: req.user.nickname,
      timestamp: new Date(),
      note: `工单已派发给 ${assignee.nickname}`,
    });
    await workOrder.save();

    res.json({
      success: true,
      data: workOrder,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateWorkOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, resolution, cost, parts, rating, comment } = req.body;

    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) {
      return res.status(404).json({ message: '工单不存在' });
    }

    if (workOrder.assigneeId && workOrder.assigneeId.toString() !== req.user._id.toString() && req.user.role !== 'operator' && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限操作此工单' });
    }

    const statusActions = {
      processing: '开始处理',
      pending_parts: '待备件',
      completed: '完成',
      cancelled: '取消',
    };

    if (status === 'processing' && !workOrder.actualStartTime) {
      workOrder.actualStartTime = new Date();
    }

    if (status === 'completed') {
      workOrder.actualEndTime = new Date();
      workOrder.resolution = resolution;
      workOrder.cost = cost;
      workOrder.parts = parts;
      
      const device = await Device.findById(workOrder.deviceId);
      if (device && device.status === 'faulty') {
        device.status = 'online';
        device.workingStatus = 'idle';
        device.lastMaintenance = new Date();
        device.nextMaintenance = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await device.save();
      }

      const grid = await Grid.findById(workOrder.gridId);
      if (grid) {
        grid.maintenanceCount = (grid.maintenanceCount || 0) + 1;
        grid.faultCount = Math.max(0, (grid.faultCount || 0) - 1);
        await grid.save();
      }
    }

    if (rating) {
      workOrder.rating = rating;
      workOrder.comment = comment;
    }

    workOrder.status = status;
    workOrder.auditLog.push({
      action: status,
      operatorId: req.user._id,
      operatorName: req.user.nickname,
      timestamp: new Date(),
      note: note || statusActions[status] || `状态更新为 ${status}`,
    });
    await workOrder.save();

    res.json({
      success: true,
      data: workOrder,
    });
  } catch (error) {
    next(error);
  }
};
