const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const { sendMessageValidator, idParamValidator } = require('../middleware/validators');

router.get('/conversations', authenticate, messageController.getConversations);

router.post('/conversations', authenticate, messageController.createConversation);

router.get('/unread-count', authenticate, messageController.getUnreadCount);

router.get('/conversations/:conversationId/messages', authenticate, messageController.getMessages);

router.post('/conversations/:conversationId/messages', authenticate, sendMessageValidator, messageController.sendMessage);

module.exports = router;
