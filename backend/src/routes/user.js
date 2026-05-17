const express = require('express');
const {
  updateProfile,
  getOrders,
  getMessages,
  markMessageRead,
  getStudyMaterials
} = require('../controllers/user');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.put('/profile', authenticateToken, updateProfile);
router.get('/orders', authenticateToken, getOrders);
router.get('/messages', authenticateToken, getMessages);
router.put('/messages/:messageId/read', authenticateToken, markMessageRead);
router.get('/study-materials', authenticateToken, getStudyMaterials);

module.exports = router;
