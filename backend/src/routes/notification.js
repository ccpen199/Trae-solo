const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Notification, User, Enterprise } = require('../models');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const { userId, enterpriseId, type, isRead, priority, page = 1, pageSize = 20 } = req.query;
    const where = {};

    if (userId) where.userId = userId;
    if (enterpriseId) where.enterpriseId = enterpriseId;
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (priority) where.priority = priority;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'role'] },
        { model: Enterprise, as: 'enterprise', attributes: ['id', 'name', 'code'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
    });

    res.json({ success: true, data: { total: count, page: parseInt(page), pageSize: parseInt(pageSize), data: rows } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/unread/count', async (req, res) => {
  try {
    const { userId, enterpriseId } = req.query;
    const where = { isRead: false };

    if (userId) where.userId = userId;
    if (enterpriseId) where.enterpriseId = enterpriseId;

    const count = await Notification.count({ where });
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'role'] },
        { model: Enterprise, as: 'enterprise', attributes: ['id', 'name', 'code'] },
      ],
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: '通知不存在' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, enterpriseId, type, title, content, relatedId, relatedType, priority, expireAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, error: '请填写通知标题和内容' });
    }

    const notification = await Notification.create({
      id: uuidv4(),
      userId,
      enterpriseId,
      type: type || 'system_notice',
      title,
      content,
      relatedId,
      relatedType,
      priority: priority || 'medium',
      expireAt,
      isRead: false,
    });

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ success: false, error: '通知不存在' });
    }

    await notification.update({
      isRead: true,
      readAt: new Date(),
    });

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/batch/read', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, error: '请提供通知ID数组' });
    }

    const result = await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { id: { [Op.in]: ids } } }
    );

    res.json({ success: true, data: { updatedCount: result[0] } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/all/read', async (req, res) => {
  try {
    const { userId, enterpriseId } = req.body;
    const where = { isRead: false };

    if (userId) where.userId = userId;
    if (enterpriseId) where.enterpriseId = enterpriseId;

    const result = await Notification.update(
      { isRead: true, readAt: new Date() },
      { where }
    );

    res.json({ success: true, data: { updatedCount: result[0] } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/types/stats', async (req, res) => {
  try {
    const { userId, enterpriseId } = req.query;
    const where = { isRead: false };

    if (userId) where.userId = userId;
    if (enterpriseId) where.enterpriseId = enterpriseId;

    const stats = await Notification.findAll({
      where,
      attributes: ['type', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['type'],
      raw: true,
    });

    const priorityStats = await Notification.findAll({
      where,
      attributes: ['priority', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['priority'],
      raw: true,
    });

    const typeMap = {};
    stats.forEach(s => {
      typeMap[s.type] = parseInt(s.count);
    });

    const priorityMap = {};
    priorityStats.forEach(s => {
      priorityMap[s.priority] = parseInt(s.count);
    });

    res.json({
      success: true,
      data: {
        byType: typeMap,
        byPriority: priorityMap,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
