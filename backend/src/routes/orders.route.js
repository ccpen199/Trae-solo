const express = require('express');
const mainOrderService = require('../services/main-order.service');
const statusFlowService = require('../services/status-flow.service');
const todoService = require('../services/todo.service');
const notificationService = require('../services/notification.service');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, currentStep, type, initiatorId, currentOwnerId, limit = 50, offset = 0 } = req.query;
    const user = req.user;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    if (status) options.status = status;
    if (currentStep) options.currentStep = currentStep;
    if (type) options.type = type;
    if (initiatorId) options.initiatorId = initiatorId;
    if (currentOwnerId) options.currentOwnerId = currentOwnerId;

    const orders = mainOrderService.getMainOrders(options);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = mainOrderService.getMainOrder(id);

    if (!order) {
      return res.status(404).json({ success: false, message: '主单不存在' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const user = req.user;
    const { type, title, description, expectedTime, priority, dataContent } = req.body;

    if (!type || !title) {
      return res.status(400).json({ success: false, message: '类型和标题不能为空' });
    }

    const order = mainOrderService.createMainOrder({
      type,
      title,
      description,
      initiatorId: user.id,
      expectedTime,
      priority,
      dataContent,
    });

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, expectedTime, priority, dataContent, chatIds } = req.body;

    const result = mainOrderService.updateMainOrder(id, {
      title,
      description,
      expectedTime,
      priority,
      dataContent,
      chatIds,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/submit', (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { contacts, responsiblePersonId, expectedTime } = req.body;

    const result = mainOrderService.submitOrgSync(id, user.id, {
      contacts,
      responsiblePersonId,
      expectedTime,
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/:id/chat-communication/action', (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { action, remark, nextOwnerId } = req.body;

    const result = mainOrderService.processChatCommunication(id, user.id, action, {
      remark,
      nextOwnerId,
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/:id/file-send/action', (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { action, remark, nextOwnerId, attachments } = req.body;

    const result = mainOrderService.processFileSend(id, user.id, action, {
      remark,
      nextOwnerId,
      attachments,
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/:id/task-notification/action', (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { action, remark, nextOwnerId } = req.body;

    const result = mainOrderService.processTaskNotification(id, user.id, action, {
      remark,
      nextOwnerId,
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/:id/archive', (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { remark } = req.body;

    const result = mainOrderService.processArchive(id, user.id, { remark });

    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/:id/status-flow', (req, res) => {
  try {
    const { id } = req.params;
    const flow = statusFlowService.getStatusFlow(id);

    res.json({
      success: true,
      data: flow,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/comments', (req, res) => {
  try {
    const { id } = req.params;
    const comments = mainOrderService.getComments(id);

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/actions/available', (req, res) => {
  const { step, status, userRole } = req.query;
  const actions = statusFlowService.getAvailableActions(step, status, userRole);

  res.json({
    success: true,
    data: actions,
  });
});

module.exports = router;
