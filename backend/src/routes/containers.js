const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const containerService = require('../services/containerService');
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

router.get('/types', (req, res) => {
  try {
    const types = containerService.getAvailableContainerTypes();
    res.json({
      success: true,
      data: types,
    });
  } catch (error) {
    console.error('Get container types error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/assign', [
  body('mainId').notEmpty().withMessage('主单ID不能为空'),
  body('containerNo').notEmpty().withMessage('箱号不能为空'),
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

    const {
      mainId,
      detailId,
      containerNo,
      containerType,
      sealNo,
      weight,
      volume,
    } = req.body;

    const result = containerService.assignContainer({
      mainId: parseInt(mainId),
      detailId: detailId ? parseInt(detailId) : null,
      containerNo,
      containerType,
      sealNo,
      weight: weight ? parseFloat(weight) : null,
      volume: volume ? parseFloat(volume) : null,
      userId: user.id,
      userRole: user.role,
    });

    res.json(result);
  } catch (error) {
    console.error('Assign container error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/batch-assign', [
  body('mainId').notEmpty().withMessage('主单ID不能为空'),
  body('containers').isArray().withMessage('箱号列表必须是数组'),
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

    const { mainId, containers } = req.body;

    const result = containerService.batchAssignContainers({
      mainId: parseInt(mainId),
      containers,
      userId: user.id,
      userRole: user.role,
    });

    res.json(result);
  } catch (error) {
    console.error('Batch assign container error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/validate', [
  body('containerNo').notEmpty().withMessage('箱号不能为空'),
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

    const { containerNo, detailId } = req.body;
    const validation = containerService.validateContainerAssignment(containerNo, detailId);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('Validate container error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/port-entry', [
  body('mainId').notEmpty().withMessage('主单ID不能为空'),
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

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const {
      mainId,
      detailId,
      action,
      comment,
      attachments,
      newAssignedTo,
    } = req.body;

    const validActions = ['approve_port_entry', 'reject', 'request_additional_info', 'reassign'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: '无效的操作类型',
      });
    }

    const result = containerService.processPortEntry({
      mainId: parseInt(mainId),
      detailId: detailId ? parseInt(detailId) : null,
      action,
      userId: user.id,
      userRole: user.role,
      comment,
      attachments,
      newAssignedTo: newAssignedTo ? parseInt(newAssignedTo) : null,
    });

    res.json(result);
  } catch (error) {
    console.error('Process port entry error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/check/:detailId', (req, res) => {
  try {
    const { detailId } = req.params;
    const result = containerService.checkContainerForPortEntry(parseInt(detailId));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Check container error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

module.exports = router;
