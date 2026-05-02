const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const messageService = require('../services/messageService');
const { ROLES } = require('../utils/constants');

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
  query('status').optional(),
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

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const { status, limit = 50, offset = 0 } = req.query;

    const result = messageService.getMessagesByUser(user.id, {
      status,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/pending-count', (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const count = messageService.getPendingCountByUser(user.id);

    res.json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/main/:mainId', (req, res) => {
  try {
    const { mainId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const result = messageService.getMessagesByMainId(parseInt(mainId), {
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get messages by mainId error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const result = messageService.markAsRead(parseInt(id), user.id);

    res.json({
      success: true,
      data: {
        marked: result,
      },
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/complete', (req, res) => {
  try {
    const { id } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const result = messageService.markAsCompleted(parseInt(id), user.id);

    res.json({
      success: true,
      data: {
        marked: result,
      },
    });
  } catch (error) {
    console.error('Mark message as completed error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/main/:mainId/read-all', (req, res) => {
  try {
    const { mainId } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const count = messageService.markMessagesAsReadByMainId(parseInt(mainId), user.id);

    res.json({
      success: true,
      data: {
        markedCount: count,
      },
    });
  } catch (error) {
    console.error('Mark all messages as read error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/by-role/:role', [
  query('status').optional(),
], (req, res) => {
  try {
    const { role } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: '无效的角色',
      });
    }

    const result = messageService.getMessagesByRole(role, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get messages by role error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

module.exports = router;
