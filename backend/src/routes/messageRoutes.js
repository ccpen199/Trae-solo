const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, messageController.getMyMessages);
router.get('/product/:productId', messageController.getProductMessages);
router.post('/', authenticateToken, messageController.createMessage);
router.put('/:id/read', authenticateToken, messageController.markAsRead);

module.exports = router;
