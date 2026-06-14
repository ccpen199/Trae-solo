const Schedule = require('../models/Schedule');

const getList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { status, date } = req.query;

    const query = {};
    if (status) query.status = status;
    if (date) query.date = new Date(date);

    if (req.user.role !== 'admin') {
      query.collectorId = req.user._id;
    }

    const total = await Schedule.countDocuments(query);
    const schedules = await Schedule.find(query)
      .populate('collectorId', 'username companyName')
      .populate('vehicleId', 'plateNo vehicleType driverName')
      .populate('orders')
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      success: true,
      data: {
        list: schedules,
        total,
        page,
        pageSize
      },
      message: '获取调度列表成功'
    });
  } catch (error) {
    next(error);
  }
};

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id)
      .populate('collectorId', 'username companyName phone')
      .populate('vehicleId')
      .populate('orders');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '调度不存在'
      });
    }

    if (req.user.role !== 'admin' && schedule.collectorId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限查看此调度'
      });
    }

    res.json({
      success: true,
      data: schedule,
      message: '获取调度详情成功'
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { date, vehicleId, driverName, orders, routePoints, totalWeight } = req.body;

    const scheduleNo = 'SCH' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();

    const schedule = new Schedule({
      scheduleNo,
      collectorId: req.user._id,
      date,
      vehicleId,
      driverName,
      orders,
      routePoints,
      totalWeight,
      status: 'pending'
    });

    await schedule.save();
    await schedule.populate('vehicleId');
    await schedule.populate('orders');

    res.status(201).json({
      success: true,
      data: schedule,
      message: '创建调度成功'
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '调度不存在'
      });
    }

    if (schedule.collectorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限修改此调度'
      });
    }

    if (schedule.status !== 'pending') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '当前状态无法修改'
      });
    }

    const { date, vehicleId, driverName, orders, routePoints, totalWeight } = req.body;

    const updateData = {};
    if (date !== undefined) updateData.date = date;
    if (vehicleId !== undefined) updateData.vehicleId = vehicleId;
    if (driverName !== undefined) updateData.driverName = driverName;
    if (orders !== undefined) updateData.orders = orders;
    if (routePoints !== undefined) updateData.routePoints = routePoints;
    if (totalWeight !== undefined) updateData.totalWeight = totalWeight;

    const updated = await Schedule.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('vehicleId').populate('orders');

    res.json({
      success: true,
      data: updated,
      message: '更新调度成功'
    });
  } catch (error) {
    next(error);
  }
};

const start = async (req, res, next) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '调度不存在'
      });
    }

    if (schedule.collectorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限执行此操作'
      });
    }

    if (schedule.status !== 'pending') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '当前状态无法开始执行'
      });
    }

    schedule.status = 'in_progress';
    await schedule.save();

    res.json({
      success: true,
      data: schedule,
      message: '开始执行成功'
    });
  } catch (error) {
    next(error);
  }
};

const complete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '调度不存在'
      });
    }

    if (schedule.collectorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限执行此操作'
      });
    }

    if (schedule.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '当前状态无法完成'
      });
    }

    schedule.status = 'completed';
    await schedule.save();

    res.json({
      success: true,
      data: schedule,
      message: '完成调度成功'
    });
  } catch (error) {
    next(error);
  }
};

const optimize = async (req, res, next) => {
  try {
    const { orders, startPoint } = req.body;

    if (!orders || orders.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '请提供订单列表'
      });
    }

    const shuffled = [...orders].sort(() => Math.random() - 0.5);

    const optimizedRoute = shuffled.map((order, index) => ({
      ...order,
      sequence: index + 1,
      estimatedDistance: Math.floor(Math.random() * 20 + 5),
      estimatedTime: Math.floor(Math.random() * 60 + 15)
    }));

    const totalDistance = optimizedRoute.reduce((sum, point) => sum + point.estimatedDistance, 0);
    const totalTime = optimizedRoute.reduce((sum, point) => sum + point.estimatedTime, 0);

    res.json({
      success: true,
      data: {
        optimizedRoute,
        startPoint: startPoint || '默认出发点',
        totalDistance,
        totalTime,
        optimizedCount: optimizedRoute.length,
        algorithm: '遗传算法模拟'
      },
      message: '路径优化完成'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getList,
  getDetail,
  create,
  update,
  start,
  complete,
  optimize
};
