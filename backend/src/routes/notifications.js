const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, notificationController.getList);
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);
router.post('/:id/read', authMiddleware, notificationController.markAsRead);

module.exports = router;
