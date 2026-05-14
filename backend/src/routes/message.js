const express = require('express');
const { sendMessage, getMessages, getConversations } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, sendMessage);
router.get('/conversations', authenticateToken, getConversations);
router.get('/:otherUserId', authenticateToken, getMessages);

module.exports = router;
