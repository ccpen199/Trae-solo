const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const auditService = require('../services/auditService');

router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
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
      mainId,
      userId,
      userRole,
      action,
      startTime,
      endTime,
      limit = 100,
      offset = 0,
    } = req.query;

    const result = auditService.searchLogs({
      mainId: mainId ? parseInt(mainId) : undefined,
      userId: userId ? parseInt(userId) : undefined,
      userRole,
      action,
      startTime,
      endTime,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/main/:mainId', (req, res) => {
  try {
    const { mainId } = req.params;
    const { limit = 100 } = req.query;

    const logs = auditService.getLogsByMainId(parseInt(mainId), parseInt(limit));

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get audit logs by mainId error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;

    const logs = auditService.getLogsByUserId(parseInt(userId), parseInt(limit));

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get audit logs by userId error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

module.exports = router;
