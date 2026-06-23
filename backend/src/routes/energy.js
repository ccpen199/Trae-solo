const express = require('express');
const EnergyUsage = require('../models/EnergyUsage');
const DormitoryBuilding = require('../models/DormitoryBuilding');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, buildingId, studentId, deviceId, startDate, endDate, isAbnormal, season } = req.query;
    const query = {};

    if (buildingId) query.buildingId = buildingId;
    if (studentId) query.studentId = studentId;
    if (deviceId) query.deviceId = deviceId;
    if (isAbnormal !== undefined) query.isAbnormal = isAbnormal === 'true';
    if (season) query.season = season;
    if (startDate) query.startTime = { ...query.startTime, $gte: new Date(startDate) };
    if (endDate) query.startTime = { ...query.startTime, $lte: new Date(endDate) };

    const records = await EnergyUsage.find(query)
      .populate('buildingId', 'buildingName')
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await EnergyUsage.countDocuments(query);

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

router.get('/statistics', authenticateAdmin, async (req, res, next) => {
  try {
    const { startDate, endDate, buildingId, period = 'day' } = req.query;
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);
    const query = Object.keys(dateQuery).length > 0 ? { startTime: dateQuery } : {};
    if (buildingId) query.buildingId = buildingId;

    const totalRecords = await EnergyUsage.countDocuments(query);
    const totalWater = await EnergyUsage.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$waterVolume' }, totalCost: { $sum: '$cost' } } }
    ]);

    const abnormalCount = await EnergyUsage.countDocuments({ ...query, isAbnormal: true });

    const dateFormat = period === 'day' ? '%Y-%m-%d' : period === 'month' ? '%Y-%m' : '%Y';
    const timeSeries = await EnergyUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$startTime' } },
          totalWater: { $sum: '$waterVolume' },
          totalCost: { $sum: '$cost' },
          usageCount: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    const buildingComparison = await EnergyUsage.aggregate([
      { $match: query },
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
          totalWater: { $sum: '$waterVolume' },
          totalCost: { $sum: '$cost' },
          usageCount: { $sum: 1 },
          avgPerStudent: { $avg: '$waterVolume' }
        }
      },
      { $sort: { totalWater: -1 } }
    ]);

    const gradeComparison = await EnergyUsage.aggregate([
      { $match: { ...query, studentId: { $exists: true } } },
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
          studentCount: { $addToSet: '$studentId' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const seasonStats = await EnergyUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$season',
          totalWater: { $sum: '$waterVolume' },
          totalCost: { $sum: '$cost' },
          usageCount: { $sum: 1 },
          avgTemperature: { $avg: '$avgTemperature' }
        }
      }
    ]);

    const hourDistribution = await EnergyUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$hourOfDay',
          count: { $sum: 1 },
          totalWater: { $sum: '$waterVolume' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const weekDistribution = await EnergyUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$dayOfWeek',
          count: { $sum: 1 },
          totalWater: { $sum: '$waterVolume' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const abnormalRecords = await EnergyUsage.find({ ...query, isAbnormal: true })
      .sort({ startTime: -1 })
      .limit(20)
      .populate('buildingId', 'buildingName');

    const yoyComparison = await calculateYoYComparison(query);

    res.json({
      success: true,
      data: {
        totalRecords,
        totalWater: totalWater[0]?.total || 0,
        totalCost: totalWater[0]?.totalCost || 0,
        abnormalCount,
        abnormalRate: totalRecords > 0 ? ((abnormalCount / totalRecords) * 100).toFixed(2) : 0,
        timeSeries,
        buildingComparison,
        gradeComparison: gradeComparison.map(g => ({
          ...g,
          studentCount: g.studentCount.length
        })),
        seasonStats,
        hourDistribution,
        weekDistribution,
        recentAbnormal: abnormalRecords,
        yoyComparison
      }
    });
  } catch (error) {
    next(error);
  }
});

async function calculateYoYComparison(query) {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const currentData = await EnergyUsage.aggregate([
    { $match: { ...query, year: currentYear } },
    { $group: { _id: '$month', totalWater: { $sum: '$waterVolume' }, totalCost: { $sum: '$cost' } } }
  ]);

  const lastYearData = await EnergyUsage.aggregate([
    { $match: { ...query, year: lastYear } },
    { $group: { _id: '$month', totalWater: { $sum: '$waterVolume' }, totalCost: { $sum: '$cost' } } }
  ]);

  const comparison = [];
  for (let month = 1; month <= 12; month++) {
    const curr = currentData.find(d => d._id === month);
    const last = lastYearData.find(d => d._id === month);
    comparison.push({
      month,
      currentWater: curr?.totalWater || 0,
      lastYearWater: last?.totalWater || 0,
      currentCost: curr?.totalCost || 0,
      lastYearCost: last?.totalCost || 0,
      waterGrowthRate: last?.totalWater ? (((curr?.totalWater || 0) - last.totalWater) / last.totalWater * 100).toFixed(1) : null,
      costGrowthRate: last?.totalCost ? (((curr?.totalCost || 0) - last.totalCost) / last.totalCost * 100).toFixed(1) : null
    });
  }

  return comparison;
}

router.get('/abnormal', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { isAbnormal: true };

    if (status === 'unhandled') {
      query.abnormalReason = { $exists: false };
    }

    const records = await EnergyUsage.find(query)
      .populate('buildingId', 'buildingName')
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await EnergyUsage.countDocuments(query);

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

router.post('/:id/handle-abnormal', authenticateAdmin, async (req, res, next) => {
  try {
    const { abnormalReason, remark } = req.body;
    const record = await EnergyUsage.findByIdAndUpdate(
      req.params.id,
      { abnormalReason, remark, updatedAt: Date.now() },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }

    res.json({
      success: true,
      message: '异常已处理',
      data: record
    });
  } catch (error) {
    next(error);
  }
});

router.get('/export', authenticateAdmin, async (req, res, next) => {
  try {
    const { startDate, endDate, buildingId, format = 'json' } = req.query;
    const query = {};

    if (buildingId) query.buildingId = buildingId;
    if (startDate) query.startTime = { $gte: new Date(startDate) };
    if (endDate) query.startTime = { $lte: new Date(endDate) };

    const records = await EnergyUsage.find(query)
      .populate('buildingId', 'buildingName')
      .sort({ startTime: 1 });

    if (format === 'csv') {
      const csv = [
        '时间,楼栋,楼层,学生ID,用水量(L),费用(元),平均温度(℃),时长(分钟),是否异常'
      ].concat(records.map(r => 
        `${r.startTime.toISOString()},${r.buildingId?.buildingName || ''},${r.floor},${r.studentId || ''},${r.waterVolume},${r.cost},${r.avgTemperature || ''},${r.duration},${r.isAbnormal ? '是' : '否'}`
      )).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=energy_usage.csv');
      res.send('\ufeff' + csv);
    } else {
      res.json({
        success: true,
        data: records
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
