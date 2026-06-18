const dayjs = require('dayjs');
const {
  FunnelEvent, DeviceUsage, Booking, Order, Device, User, WorkOrder, EcoIncentiveLog, Grid
} = require('../models');

exports.getFunnelAnalysis = async (req, res, next) => {
  try {
    const { communityId, deviceType, startDate, endDate } = req.query;

    const filter = {};
    if (communityId) filter.communityId = communityId;
    if (deviceType) filter.deviceType = deviceType;
    if (startDate) filter.timestamp = { $gte: new Date(startDate) };
    if (endDate) filter.timestamp = { ...filter.timestamp, $lte: new Date(endDate) };

    const events = await FunnelEvent.find(filter);

    const funnel = {
      browse_devices: events.filter(e => e.event === 'browse_devices').length,
      view_device_detail: events.filter(e => e.event === 'view_device_detail').length,
      create_booking: events.filter(e => e.event === 'create_booking').length,
      payment_init: events.filter(e => e.event === 'payment_init').length,
      payment_success: events.filter(e => e.event === 'payment_success').length,
      start_device: events.filter(e => e.event === 'start_device').length,
      complete_usage: events.filter(e => e.event === 'complete_usage').length,
      cancel_booking: events.filter(e => e.event === 'cancel_booking').length,
      report_fault: events.filter(e => e.event === 'report_fault').length,
    };

    const conversionRates = {
      browse_to_view: funnel.browse_devices > 0 ? ((funnel.view_device_detail / funnel.browse_devices) * 100).toFixed(2) : 0,
      view_to_booking: funnel.view_device_detail > 0 ? ((funnel.create_booking / funnel.view_device_detail) * 100).toFixed(2) : 0,
      booking_to_payment: funnel.create_booking > 0 ? ((funnel.payment_success / funnel.create_booking) * 100).toFixed(2) : 0,
      payment_to_start: funnel.payment_success > 0 ? ((funnel.start_device / funnel.payment_success) * 100).toFixed(2) : 0,
      start_to_complete: funnel.start_device > 0 ? ((funnel.complete_usage / funnel.start_device) * 100).toFixed(2) : 0,
      overall: funnel.browse_devices > 0 ? ((funnel.complete_usage / funnel.browse_devices) * 100).toFixed(2) : 0,
    };

    const userIds = [...new Set(events.map(e => e.userId?.toString()).filter(Boolean))];

    res.json({
      success: true,
      data: {
        funnel,
        conversionRates,
        totalUsers: userIds.length,
        totalEvents: events.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsageStatistics = async (req, res, next) => {
  try {
    const { communityId, gridId, deviceType, startDate, endDate, groupBy = 'day' } = req.query;

    const filter = {};
    if (communityId) filter.communityId = communityId;
    if (gridId) filter.gridId = gridId;
    if (deviceType) filter.deviceType = deviceType;
    if (startDate) filter.startTime = { $gte: new Date(startDate) };
    if (endDate) filter.startTime = { ...filter.startTime, $lte: new Date(endDate) };

    const usages = await DeviceUsage.find(filter).sort({ startTime: 1 });
    const bookings = await Booking.find({
      ...filter,
      startTime: filter.startTime,
    });
    const orders = await Order.find({
      ...filter,
      createdAt: filter.startTime,
      paymentStatus: 'paid',
    });

    const formatDate = (date) => {
      const d = dayjs(date);
      if (groupBy === 'hour') return d.format('YYYY-MM-DD HH:00');
      if (groupBy === 'day') return d.format('YYYY-MM-DD');
      if (groupBy === 'week') return d.startOf('week').format('YYYY-MM-DD');
      if (groupBy === 'month') return d.format('YYYY-MM');
      return d.format('YYYY-MM-DD');
    };

    const usageByDate = {};
    const durationByDate = {};
    const waterByDate = {};
    const electricityByDate = {};

    usages.forEach(usage => {
      const key = formatDate(usage.startTime);
      usageByDate[key] = (usageByDate[key] || 0) + 1;
      durationByDate[key] = (durationByDate[key] || 0) + (usage.actualDuration || usage.duration || 0);
      waterByDate[key] = (waterByDate[key] || 0) + (usage.metrics?.waterUsed || 0);
      electricityByDate[key] = (electricityByDate[key] || 0) + (usage.metrics?.electricityUsed || 0);
    });

    const deviceTypeStats = {};
    usages.forEach(usage => {
      const type = usage.deviceType || 'unknown';
      if (!deviceTypeStats[type]) {
        deviceTypeStats[type] = { count: 0, totalDuration: 0 };
      }
      deviceTypeStats[type].count++;
      deviceTypeStats[type].totalDuration += usage.actualDuration || usage.duration || 0;
    });

    const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

    res.json({
      success: true,
      data: {
        totalUsage: usages.length,
        totalDuration: usages.reduce((sum, u) => sum + (u.actualDuration || u.duration || 0), 0),
        totalBookings: bookings.length,
        totalRevenue,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        usageByDate,
        durationByDate,
        waterByDate,
        electricityByDate,
        deviceTypeStats,
        avgUsageDuration: usages.length > 0 
          ? Math.round(usages.reduce((sum, u) => sum + (u.actualDuration || u.duration || 0), 0) / usages.length)
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getDeviceStatistics = async (req, res, next) => {
  try {
    const { communityId, deviceType } = req.query;

    const filter = {};
    if (communityId) filter.communityId = communityId;
    if (deviceType) filter.deviceType = deviceType;

    const devices = await Device.find(filter);

    const statusCounts = {
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      maintenance: devices.filter(d => d.status === 'maintenance').length,
      faulty: devices.filter(d => d.status === 'faulty').length,
      retired: devices.filter(d => d.status === 'retired').length,
    };

    const workingStatusCounts = {
      idle: devices.filter(d => d.workingStatus === 'idle').length,
      running: devices.filter(d => d.workingStatus === 'running').length,
      paused: devices.filter(d => d.workingStatus === 'paused').length,
      reserved: devices.filter(d => d.workingStatus === 'reserved').length,
      completed: devices.filter(d => d.workingStatus === 'completed').length,
    };

    const typeCounts = {};
    devices.forEach(d => {
      typeCounts[d.deviceType] = (typeCounts[d.deviceType] || 0) + 1;
    });

    const topDevices = devices
      .sort((a, b) => (b.totalUsage || 0) - (a.totalUsage || 0))
      .slice(0, 10)
      .map(d => ({
        id: d._id,
        deviceCode: d.deviceCode,
        name: d.name,
        deviceType: d.deviceType,
        totalUsage: d.totalUsage || 0,
        totalDuration: d.totalDuration || 0,
        faultCount: d.faultCount || 0,
      }));

    const faultDevices = devices
      .filter(d => d.faultCount > 0)
      .sort((a, b) => (b.faultCount || 0) - (a.faultCount || 0))
      .slice(0, 10)
      .map(d => ({
        id: d._id,
        deviceCode: d.deviceCode,
        name: d.name,
        deviceType: d.deviceType,
        faultCount: d.faultCount || 0,
        status: d.status,
      }));

    res.json({
      success: true,
      data: {
        total: devices.length,
        statusCounts,
        workingStatusCounts,
        typeCounts,
        utilizationRate: devices.length > 0 
          ? ((workingStatusCounts.running / devices.length) * 100).toFixed(2)
          : 0,
        onlineRate: devices.length > 0
          ? ((statusCounts.online / devices.length) * 100).toFixed(2)
          : 0,
        faultRate: devices.length > 0
          ? ((statusCounts.faulty / devices.length) * 100).toFixed(2)
          : 0,
        topDevices,
        faultDevices,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getGridOperations = async (req, res, next) => {
  try {
    const { communityId } = req.query;

    const filter = {};
    if (communityId) filter.communityId = communityId;

    const grids = await Grid.find(filter).populate('managerId', 'nickname phone');

    const gridStats = await Promise.all(grids.map(async grid => {
      const devices = await Device.find({ gridId: grid._id });
      const workOrders = await WorkOrder.find({ gridId: grid._id });

      return {
        grid: {
          id: grid._id,
          name: grid.name,
          code: grid.code,
          area: grid.area,
          manager: grid.managerId,
          bounds: grid.bounds,
        },
        deviceCount: devices.length,
        onlineCount: devices.filter(d => d.status === 'online').length,
        faultyCount: devices.filter(d => d.status === 'faulty').length,
        runningCount: devices.filter(d => d.workingStatus === 'running').length,
        pendingOrders: workOrders.filter(wo => ['pending', 'assigned', 'processing'].includes(wo.status)).length,
        todayOrders: workOrders.filter(wo => 
          dayjs(wo.createdAt).isSame(dayjs(), 'day')
        ).length,
        faultCount: grid.faultCount || 0,
        maintenanceCount: grid.maintenanceCount || 0,
      };
    }));

    res.json({
      success: true,
      data: gridStats,
    });
  } catch (error) {
    next(error);
  }
};

exports.getEcoIncentiveStats = async (req, res, next) => {
  try {
    const { communityId, startDate, endDate } = req.query;

    const filter = {};
    if (startDate) filter.timestamp = { $gte: new Date(startDate) };
    if (endDate) filter.timestamp = { ...filter.timestamp, $lte: new Date(endDate) };

    const logs = await EcoIncentiveLog.find(filter);

    const userFilter = {};
    if (communityId) userFilter.communityId = communityId;
    const users = await User.find({ ...userFilter, streakDays: { $gt: 0 } });

    const streaks = users.map(u => u.streakDays || 0);
    const totalEcoPoints = users.reduce((sum, u) => sum + (u.ecoPoints || 0), 0);

    const stats = {
      totalUsers: users.length,
      totalEcoPoints,
      avgStreak: streaks.length > 0 ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length) : 0,
      maxStreak: streaks.length > 0 ? Math.max(...streaks) : 0,
      usersWith7DayStreak: users.filter(u => (u.streakDays || 0) >= 7).length,
      vouchersAwarded: logs.filter(l => l.type === 'voucher_awarded').length,
      vouchersClaimed: logs.filter(l => l.type === 'voucher_claimed').length,
      totalStreakDays: streaks.reduce((a, b) => a + b, 0),
      totalUsageRewards: logs.filter(l => l.type === 'usage').length,
    };

    const streakDistribution = {
      '1-3': users.filter(u => (u.streakDays || 0) >= 1 && (u.streakDays || 0) <= 3).length,
      '4-6': users.filter(u => (u.streakDays || 0) >= 4 && (u.streakDays || 0) <= 6).length,
      '7-14': users.filter(u => (u.streakDays || 0) >= 7 && (u.streakDays || 0) <= 14).length,
      '15-30': users.filter(u => (u.streakDays || 0) >= 15 && (u.streakDays || 0) <= 30).length,
      '30+': users.filter(u => (u.streakDays || 0) > 30).length,
    };

    res.json({
      success: true,
      data: {
        stats,
        streakDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCommunityOverview = async (req, res, next) => {
  try {
    const { communityId } = req.query;

    const filter = communityId ? { communityId } : {};

    const [
      totalDevices,
      onlineDevices,
      runningDevices,
      todayBookings,
      todayRevenue,
      pendingWorkOrders,
      highPriorityWorkOrders,
    ] = await Promise.all([
      Device.countDocuments({ ...filter, status: { $ne: 'retired' } }),
      Device.countDocuments({ ...filter, status: 'online' }),
      Device.countDocuments({ ...filter, workingStatus: 'running' }),
      Booking.countDocuments({
        ...filter,
        createdAt: {
          $gte: dayjs().startOf('day').toDate(),
          $lte: dayjs().endOf('day').toDate(),
        },
      }),
      Order.aggregate([
        {
          $match: {
            ...filter,
            paymentStatus: 'paid',
            createdAt: {
              $gte: dayjs().startOf('day').toDate(),
              $lte: dayjs().endOf('day').toDate(),
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).then(res => res[0]?.total || 0),
      WorkOrder.countDocuments({ ...filter, status: { $in: ['pending', 'assigned'] } }),
      WorkOrder.countDocuments({ ...filter, priority: { $in: ['high', 'urgent'] }, status: { $ne: 'completed' } }),
    ]);

    const deviceTypes = await Device.aggregate([
      { $match: { ...filter, status: { $ne: 'retired' } } },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
    ]);

    const last7DaysBookings = await Booking.aggregate([
      {
        $match: {
          ...filter,
          createdAt: { $gte: dayjs().subtract(7, 'day').toDate() },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalDevices,
        onlineDevices,
        onlineRate: totalDevices > 0 ? ((onlineDevices / totalDevices) * 100).toFixed(2) : 0,
        runningDevices,
        utilizationRate: totalDevices > 0 ? ((runningDevices / totalDevices) * 100).toFixed(2) : 0,
        todayBookings,
        todayRevenue,
        pendingWorkOrders,
        highPriorityWorkOrders,
        deviceTypes,
        last7DaysBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};
