const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { ROLES } = require('../core/stateMachine');

const getOperatorInfo = (req) => {
  return {
    role: req.headers['x-user-role'] || ROLES.OPERATOR,
    id: req.headers['x-user-id'] || 'SYSTEM'
  };
};

router.get('/', async (req, res) => {
  try {
    const operator = getOperatorInfo(req);
    const { unread_only = 'true', role, user_id } = req.query;
    
    const targetRole = role || operator.role;
    const targetId = user_id || (operator.id === 'SYSTEM' ? null : operator.id);
    const unreadOnly = unread_only === 'true';
    
    const messages = await orderService.getMessages(targetRole, targetId, unreadOnly);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const result = await orderService.markMessageRead(messageId);
    res.json({ success: true, data: { messageId, isRead: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
