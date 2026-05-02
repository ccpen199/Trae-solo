const express = require('express');
const router = express.Router();
const { query, body, validationResult } = require('express-validator');
const scheduleService = require('../services/scheduleService');

router.get('/', [
  query('status').optional(),
  query('searchText').optional(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数校验失败',
        errors: errors.array(),
      });
    }

    const { status, searchText, departurePort, arrivalPort, startDate, endDate, limit = 20, offset = 0 } = req.query;

    const options = {
      status,
      searchText,
      departurePort,
      arrivalPort,
      startDate,
      endDate,
      limit,
      offset,
    };

    const result = scheduleService.getSchedules(options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/available', (req, res) => {
  try {
    const { searchText, departurePort, arrivalPort, limit = 50, offset = 0 } = req.query;

    const options = {
      searchText,
      departurePort,
      arrivalPort,
      limit,
      offset,
    };

    const result = scheduleService.getAvailableSchedules(options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get available schedules error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/ports', (req, res) => {
  try {
    const ports = scheduleService.getPorts();
    res.json({
      success: true,
      data: ports,
    });
  } catch (error) {
    console.error('Get ports error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/shipping-companies', (req, res) => {
  try {
    const companies = scheduleService.getShippingCompanies();
    res.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error('Get shipping companies error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const schedule = scheduleService.getScheduleById(parseInt(id));

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '船期不存在',
      });
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/', [
  body('scheduleCode').notEmpty().withMessage('船期编码不能为空'),
  body('vesselName').notEmpty().withMessage('船名不能为空'),
  body('voyageNumber').notEmpty().withMessage('航次号不能为空'),
  body('departurePort').notEmpty().withMessage('出发港不能为空'),
  body('arrivalPort').notEmpty().withMessage('到达港不能为空'),
  body('departureDate').notEmpty().withMessage('出发日期不能为空'),
  body('arrivalDate').notEmpty().withMessage('到达日期不能为空'),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数校验失败',
        errors: errors.array(),
      });
    }

    const {
      scheduleCode,
      vesselName,
      voyageNumber,
      departurePort,
      arrivalPort,
      departureDate,
      arrivalDate,
      shippingCompany,
      status,
    } = req.body;

    const result = scheduleService.createSchedule({
      scheduleCode,
      vesselName,
      voyageNumber,
      departurePort,
      arrivalPort,
      departureDate,
      arrivalDate,
      shippingCompany,
      status,
    });

    res.json(result);
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      vesselName,
      voyageNumber,
      departurePort,
      arrivalPort,
      departureDate,
      arrivalDate,
      shippingCompany,
      status,
    } = req.body;

    const result = scheduleService.updateSchedule(parseInt(id), {
      vesselName,
      voyageNumber,
      departurePort,
      arrivalPort,
      departureDate,
      arrivalDate,
      shippingCompany,
      status,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = scheduleService.deleteSchedule(parseInt(id));

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

module.exports = router;
