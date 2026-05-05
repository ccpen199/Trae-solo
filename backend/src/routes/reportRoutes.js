const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');

router.use(verifyToken);

router.get('/overview', async (req, res, next) => {
  try {
    const result = await reportService.getOverallStats();
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/dormitory-occupancy', async (req, res, next) => {
  try {
    const result = await reportService.getDormitoryOccupancyStats();
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/gender-distribution', async (req, res, next) => {
  try {
    const result = await reportService.getGenderDistribution();
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/major-distribution', async (req, res, next) => {
  try {
    const result = await reportService.getMajorDistribution();
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/room-change-stats', async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const result = await reportService.getRoomChangeStats(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/monthly-checkin', async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const result = await reportService.getMonthlyCheckInStats(year);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/monthly-maintenance', async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const result = await reportService.getMonthlyMaintenanceStats(year);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/export/dormitory', requireRole('admin', 'dormitory_admin'), requirePermission('report:view'), async (req, res, next) => {
  try {
    const occupancyStats = await reportService.getDormitoryOccupancyStats();
    
    const data = occupancyStats.map(item => [
      item.building_code,
      item.building_name,
      item.gender_type,
      item.total_rooms,
      item.total_beds,
      item.occupied_beds,
      item.available_beds,
      `${item.occupancy_rate}%`
    ]);

    const columns = [
      { header: '楼栋编号', key: 'building_code', width: 15 },
      { header: '楼栋名称', key: 'building_name', width: 20 },
      { header: '性别类型', key: 'gender_type', width: 15 },
      { header: '房间总数', key: 'total_rooms', width: 12 },
      { header: '床位总数', key: 'total_beds', width: 12 },
      { header: '已入住床位', key: 'occupied_beds', width: 12 },
      { header: '空床位', key: 'available_beds', width: 12 },
      { header: '入住率', key: 'occupancy_rate', width: 12 },
    ];

    const workbook = await reportService.exportToExcel(data, {
      sheetName: '楼栋入住统计',
      columns,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=dormitory-report-${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;