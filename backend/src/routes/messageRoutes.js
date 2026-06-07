const express = require('express');
const { sendMessage, getConversation, getConversations, getUnreadCount } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, sendMessage);
router.get('/conversations', authenticateToken, getConversations);
router.get('/conversation/:otherUserId', authenticateToken, getConversation);
router.get('/unread/count', authenticateToken, getUnreadCount);

module.exports = router;
