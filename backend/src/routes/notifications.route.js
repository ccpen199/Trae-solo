const express = require('express');
const notificationService = require('../services/notification.service');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const user = req.user;
    const { isRead, limit = 50, offset = 0 } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    if (isRead !== undefined) {
      options.isRead = isRead === 'true' || isRead === '1';
    }

    const notifications = notificationService.getNotifications(user.id, options);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/unread-count', (req, res) => {
  try {
    const user = req.user;
    const count = notificationService.getUnreadCount(user.id);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/read', (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const result = notificationService.markAsRead(id, user.id);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/all/read', (req, res) => {
  try {
    const user = req.user;
    const result = notificationService.markAllAsRead(user.id);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
