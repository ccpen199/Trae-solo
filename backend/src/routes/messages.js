const express = require('express');
const { sendMessage, getMessages, getConversations } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, sendMessage);
router.get('/', authenticateToken, getMessages);
router.get('/conversations', authenticateToken, getConversations);

module.exports = router;
