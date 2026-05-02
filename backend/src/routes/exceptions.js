const express = require('express');
const router = express.Router();
const { query, body, validationResult } = require('express-validator');
const exceptionService = require('../services/exceptionService');

const getCurrentUser = (req) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  if (!userId || !userRole) {
    return null;
  }
  return {
    id: parseInt(userId),
    role: userRole,
  };
};

router.get('/', [
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

    const {
      status,
      mainId,
      exceptionType,
      priority,
      limit = 50,
      offset = 0,
    } = req.query;

    const user = getCurrentUser(req);
    const options = {
      status,
      mainId: mainId ? parseInt(mainId) : undefined,
      exceptionType,
      priority,
      limit,
      offset,
      assignedTo: user ? user.id : undefined,
    };

    const result = exceptionService.getExceptions(options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get exceptions error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/statistics', (req, res) => {
  try {
    const stats = exceptionService.getExceptionStatistics();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get exception statistics error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const exception = exceptionService.getExceptionById(parseInt(id));

    if (!exception) {
      return res.status(404).json({
        success: false,
        message: '异常记录不存在',
      });
    }

    res.json({
      success: true,
      data: exception,
    });
  } catch (error) {
    console.error('Get exception error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/', [
  body('exceptionType').notEmpty().withMessage('异常类型不能为空'),
  body('title').notEmpty().withMessage('标题不能为空'),
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
      mainId,
      detailId,
      exceptionType,
      title,
      description,
      originalData,
      compensationData,
      priority,
    } = req.body;

    const result = exceptionService.createException({
      mainId: mainId ? parseInt(mainId) : null,
      detailId: detailId ? parseInt(detailId) : null,
      exceptionType,
      title,
      description,
      originalData,
      compensationData,
      priority,
    });

    res.json(result);
  } catch (error) {
    console.error('Create exception error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/handle', [
  body('action').notEmpty().withMessage('操作类型不能为空'),
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

    const { id } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const { action, handlerComment, compensationData } = req.body;

    const validActions = ['resolve', 'escalate', 'dismiss'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: '无效的操作类型',
      });
    }

    const result = exceptionService.handleException({
      exceptionId: parseInt(id),
      userId: user.id,
      userRole: user.role,
      action,
      handlerComment,
      compensationData,
    });

    res.json(result);
  } catch (error) {
    console.error('Handle exception error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/report/position-drift', (req, res) => {
  try {
    const {
      mainId,
      detailId,
      expectedLocation,
      actualLocation,
      deviationDistance,
      timestamp,
    } = req.body;

    const result = exceptionService.reportPositionDrift({
      mainId: mainId ? parseInt(mainId) : null,
      detailId: detailId ? parseInt(detailId) : null,
      expectedLocation,
      actualLocation,
      deviationDistance,
      timestamp,
    });

    res.json(result);
  } catch (error) {
    console.error('Report position drift error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/report/route-deviation', (req, res) => {
  try {
    const {
      mainId,
      detailId,
      plannedRoute,
      actualRoute,
      deviationReason,
    } = req.body;

    const result = exceptionService.reportRouteDeviation({
      mainId: mainId ? parseInt(mainId) : null,
      detailId: detailId ? parseInt(detailId) : null,
      plannedRoute,
      actualRoute,
      deviationReason,
    });

    res.json(result);
  } catch (error) {
    console.error('Report route deviation error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/report/driver-refuse', (req, res) => {
  try {
    const {
      mainId,
      detailId,
      driverName,
      driverPhone,
      refuseReason,
    } = req.body;

    const result = exceptionService.reportDriverRefuse({
      mainId: mainId ? parseInt(mainId) : null,
      detailId: detailId ? parseInt(detailId) : null,
      driverName,
      driverPhone,
      refuseReason,
    });

    res.json(result);
  } catch (error) {
    console.error('Report driver refuse error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/report/arrival-unconfirmed', (req, res) => {
  try {
    const {
      mainId,
      detailId,
      expectedArrivalTime,
      actualTime,
      location,
    } = req.body;

    const result = exceptionService.reportArrivalUnconfirmed({
      mainId: mainId ? parseInt(mainId) : null,
      detailId: detailId ? parseInt(detailId) : null,
      expectedArrivalTime,
      actualTime,
      location,
    });

    res.json(result);
  } catch (error) {
    console.error('Report arrival unconfirmed error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/report/map-callback-delay', (req, res) => {
  try {
    const {
      mainId,
      detailId,
      requestId,
      expectedResponseTime,
      actualDelay,
      lastKnownStatus,
    } = req.body;

    const result = exceptionService.reportMapCallbackDelay({
      mainId: mainId ? parseInt(mainId) : null,
      detailId: detailId ? parseInt(detailId) : null,
      requestId,
      expectedResponseTime,
      actualDelay,
      lastKnownStatus,
    });

    res.json(result);
  } catch (error) {
    console.error('Report map callback delay error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

module.exports = router;
