const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message');
const authMiddleware = require('../middleware/auth');

router.get('/conversations', authMiddleware, messageController.getConversations);
router.post('/send', authMiddleware, messageController.sendMessage);
router.get('/', authMiddleware, messageController.getMessages);
router.get('/unread-count', authMiddleware, messageController.getUnreadCount);
router.post('/mark-read', authMiddleware, messageController.markAsRead);
router.get('/announcements', messageController.getAnnouncements);
router.get('/announcements/:id', messageController.getAnnouncementById);

module.exports = router;