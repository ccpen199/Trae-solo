const express = require('express');
const Device = require('../models/Device');
const StudentAccount = require('../models/StudentAccount');
const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const WorkOrder = require('../models/WorkOrder');
const EnergyUsage = require('../models/EnergyUsage');
const DormitoryBuilding = require('../models/DormitoryBuilding');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authenticateAdmin, async (req, res, next) => {
  try {
    const [
      totalDevices,
      onlineDevices,
      offlineDevices,
      faultDevices,
      totalStudents,
      activeStudents,
      totalBalance,
      todayRecharge,
      todayConsumption,
      newAlerts,
      pendingWorkOrders,
      todayWaterUsage
    ] = await Promise.all([
      Device.countDocuments(),
      Device.countDocuments({ status: 'online' }),
      Device.countDocuments({ status: 'offline' }),
      Device.countDocuments({ status: 'fault' }),
      StudentAccount.countDocuments(),
      StudentAccount.countDocuments({ status: 'active' }),
      StudentAccount.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
      getTodayTransactionAmount('recharge'),
      getTodayTransactionAmount('consumption'),
      Alert.countDocuments({ status: 'new' }),
      WorkOrder.countDocuments({ status: { $in: ['pending', 'assigned', 'in_progress'] } }),
      getTodayWaterUsage()
    ]);

    const onlineRate = totalDevices > 0 ? ((onlineDevices / totalDevices) * 100).toFixed(1) : 0;
    const faultRate = totalDevices > 0 ? ((faultDevices / totalDevices) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        devices: {
          total: totalDevices,
          online: onlineDevices,
          offline: offlineDevices,
          fault: faultDevices,
          onlineRate,
          faultRate
        },
        students: {
          total: totalStudents,
          active: activeStudents,
          totalBalance: totalBalance[0]?.total || 0
        },
        finance: {
          todayRecharge: todayRecharge || 0,
          todayConsumption: todayConsumption || 0,
          netFlow: (todayRecharge || 0) - (todayConsumption || 0)
        },
        operations: {
          newAlerts,
          pendingWorkOrders,
          todayWaterUsage: todayWaterUsage || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

async function getTodayTransactionAmount(type) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await Transaction.aggregate([
    {
      $match: {
        type,
        status: 'success',
        createdAt: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: type === 'consumption' ? { $abs: '$amount' } : '$amount' }
      }
    }
  ]);

  return result[0]?.total || 0;
}

async function getTodayWaterUsage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await EnergyUsage.aggregate([
    {
      $match: {
        startTime: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$waterVolume' }
      }
    }
  ]);

  return result[0]?.total || 0;
}

router.get('/trends', authenticateAdmin, async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    let days = 7;
    if (period === '30d') days = 30;
    if (period === '90d') days = 90;

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);

    const dailyTransactions = await Transaction.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          recharge: { $sum: { $cond: [{ $eq: ['$type', 'recharge'] }, '$amount', 0] } },
          consumption: { $sum: { $cond: [{ $eq: ['$type', 'consumption'] }, { $abs: '$amount' }, 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyWaterUsage = await EnergyUsage.aggregate([
      {
        $match: {
          startTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          totalWater: { $sum: '$waterVolume' },
          totalCost: { $sum: '$cost' },
          usageCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const deviceStatusHistory = await Device.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const alertTrend = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        dailyTransactions,
        dailyWaterUsage,
        deviceStatusHistory,
        alertTrend
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/realtime', authenticateAdmin, async (req, res, next) => {
  try {
    const recentAlerts = await Alert.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('buildingId', 'buildingName');

    const recentTransactions = await Transaction.find({ status: 'success' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('accountId', 'name');

    const recentWorkOrders = await WorkOrder.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assigneeId', 'name');

    const activeDevices = await Device.find({ status: 'online', currentFlowRate: { $gt: 0 } })
      .limit(20)
      .populate('buildingId', 'buildingName');

    res.json({
      success: true,
      data: {
        recentAlerts,
        recentTransactions,
        recentWorkOrders,
        activeDevices
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/building-comparison', authenticateAdmin, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buildingStats = await EnergyUsage.aggregate([
      {
        $match: {
          startTime: { $gte: today }
        }
      },
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
          buildingType: { $first: '$building.buildingType' },
          totalWater: { $sum: '$waterVolume' },
          totalCost: { $sum: '$cost' },
          usageCount: { $sum: 1 },
          studentCount: { $addToSet: '$studentId' }
        }
      },
      { $sort: { totalWater: -1 } }
    ]);

    const result = buildingStats.map(b => ({
      ...b,
      studentCount: b.studentCount.length,
      avgPerStudent: b.studentCount.length > 0 ? (b.totalWater / b.studentCount.length).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.get('/grade-comparison', authenticateAdmin, async (req, res, next) => {
  try {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const gradeStats = await EnergyUsage.aggregate([
      {
        $match: {
          startTime: { $gte: thisMonth },
          studentId: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'studentaccounts',
          localField: 'studentId',
          foreignField: 'studentId',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: '$student.grade',
          totalWater: { $sum: '$waterVolume' },
          totalCost: { $sum: '$cost' },
          usageCount: { $sum: 1 },
          students: { $addToSet: '$studentId' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const result = gradeStats.map(g => ({
      grade: g._id,
      totalWater: g.totalWater,
      totalCost: g.totalCost,
      usageCount: g.usageCount,
      studentCount: g.students.length,
      avgPerStudent: g.students.length > 0 ? (g.totalWater / g.students.length).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.get('/fault-heatmap', authenticateAdmin, async (req, res, next) => {
  try {
    const buildings = await DormitoryBuilding.find({}, 'buildingId buildingName totalFloors faultHeatMap');
    
    const heatmapData = buildings.map(building => ({
      buildingId: building.buildingId,
      buildingName: building.buildingName,
      totalFloors: building.totalFloors,
      floors: building.faultHeatMap || []
    }));

    res.json({
      success: true,
      data: heatmapData
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
