const express = require('express');
const DormitoryBuilding = require('../models/DormitoryBuilding');
const Device = require('../models/Device');
const EnergyUsage = require('../models/EnergyUsage');
const { authenticateAdmin, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const { buildingType, search } = req.query;
    const query = {};

    if (buildingType) query.buildingType = buildingType;
    if (search) {
      query.$or = [
        { buildingId: { $regex: search, $options: 'i' } },
        { buildingName: { $regex: search, $options: 'i' } }
      ];
    }

    const buildings = await DormitoryBuilding.find(query)
      .sort({ buildingId: 1 });

    res.json({
      success: true,
      data: buildings
    });
  } catch (error) {
    next(error);
  }
});

router.get('/statistics', authenticateAdmin, async (req, res, next) => {
  try {
    const buildings = await DormitoryBuilding.find();
    
    const buildingStats = await Promise.all(buildings.map(async (building) => {
      const deviceCount = await Device.countDocuments({ buildingId: building._id });
      const onlineDevices = await Device.countDocuments({ buildingId: building._id, status: 'online' });
      const faultDevices = await Device.countDocuments({ buildingId: building._id, status: 'fault' });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayUsage = await EnergyUsage.aggregate([
        {
          $match: {
            buildingId: building._id,
            startTime: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            totalWater: { $sum: '$waterVolume' },
            totalCost: { $sum: '$cost' },
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        id: building._id,
        buildingId: building.buildingId,
        buildingName: building.buildingName,
        buildingType: building.buildingType,
        totalStudents: building.totalStudents,
        deviceCount,
        onlineDevices,
        faultDevices,
        onlineRate: deviceCount > 0 ? ((onlineDevices / deviceCount) * 100).toFixed(1) : 0,
        faultRate: deviceCount > 0 ? ((faultDevices / deviceCount) * 100).toFixed(2) : 0,
        todayWaterUsage: todayUsage[0]?.totalWater || 0,
        todayCost: todayUsage[0]?.totalCost || 0,
        todayUsageCount: todayUsage[0]?.count || 0,
        faultHeatMap: building.faultHeatMap
      };
    }));

    res.json({
      success: true,
      data: buildingStats
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const building = await DormitoryBuilding.findById(req.params.id);

    if (!building) {
      return res.status(404).json({ success: false, message: '宿舍楼不存在' });
    }

    const devices = await Device.find({ buildingId: req.params.id })
      .sort({ floor: 1, roomNumber: 1 });

    const deviceStats = await Device.aggregate([
      { $match: { buildingId: building._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        building,
        devices,
        deviceStats
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { buildingId, buildingName, buildingType, totalFloors, roomsPerFloor,
            address, waterMeterId, electricityMeterId, managerName, managerPhone } = req.body;

    const existing = await DormitoryBuilding.findOne({ buildingId });
    if (existing) {
      return res.status(400).json({ success: false, message: '宿舍楼编号已存在' });
    }

    const faultHeatMap = [];
    for (let i = 1; i <= totalFloors; i++) {
      faultHeatMap.push({
        floor: i,
        faultCount: 0,
        lastFaultDate: null
      });
    }

    const building = new DormitoryBuilding({
      buildingId,
      buildingName,
      buildingType,
      totalFloors,
      roomsPerFloor,
      address,
      waterMeterId,
      electricityMeterId,
      managerName,
      managerPhone,
      faultHeatMap
    });

    await building.save();

    res.status(201).json({
      success: true,
      message: '宿舍楼创建成功',
      data: building
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res, next) => {
  try {
    const building = await DormitoryBuilding.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!building) {
      return res.status(404).json({ success: false, message: '宿舍楼不存在' });
    }

    res.json({
      success: true,
      message: '宿舍楼更新成功',
      data: building
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res, next) => {
  try {
    const building = await DormitoryBuilding.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ success: false, message: '宿舍楼不存在' });
    }

    const deviceCount = await Device.countDocuments({ buildingId: req.params.id });
    if (deviceCount > 0) {
      return res.status(400).json({ success: false, message: '该宿舍楼仍有设备，无法删除' });
    }

    await building.deleteOne();

    res.json({
      success: true,
      message: '宿舍楼删除成功'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/meter-data', authenticateAdmin, requireRole('super_admin', 'admin', 'operator'), async (req, res, next) => {
  try {
    const { date, waterReading, electricityReading, waterUsage, electricityUsage, waterCost, electricityCost } = req.body;
    const building = await DormitoryBuilding.findById(req.params.id);

    if (!building) {
      return res.status(404).json({ success: false, message: '宿舍楼不存在' });
    }

    building.waterMeterData.push({
      date: new Date(date),
      totalReading: waterReading,
      dailyUsage: waterUsage,
      cost: waterCost
    });

    building.electricityMeterData.push({
      date: new Date(date),
      totalReading: electricityReading,
      dailyUsage: electricityUsage,
      cost: electricityCost
    });

    building.updatedAt = Date.now();
    await building.save();

    res.json({
      success: true,
      message: '水电表数据已录入'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/energy-report', authenticateAdmin, async (req, res, next) => {
  try {
    const { period = 'month', year, month } = req.query;
    const building = await DormitoryBuilding.findById(req.params.id);

    if (!building) {
      return res.status(404).json({ success: false, message: '宿舍楼不存在' });
    }

    const now = new Date();
    const targetYear = parseInt(year) || now.getFullYear();
    const targetMonth = parseInt(month) || now.getMonth() + 1;

    const query = {
      buildingId: building._id,
      year: targetYear
    };

    if (period === 'month') {
      query.month = targetMonth;
    }

    const usageData = await EnergyUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: period === 'month' ? '$dayOfWeek' : '$month',
          totalWater: { $sum: '$waterVolume' },
          totalCost: { $sum: '$cost' },
          avgTemperature: { $avg: '$avgTemperature' },
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const studentUsage = await EnergyUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$studentId',
          totalWater: { $sum: '$waterVolume' },
          totalCost: { $sum: '$cost' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalWater: -1 } },
      { $limit: 10 }
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

    res.json({
      success: true,
      data: {
        buildingName: building.buildingName,
        period,
        year: targetYear,
        month: targetMonth,
        usageData,
        topStudents: studentUsage,
        hourDistribution
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
