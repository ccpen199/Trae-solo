const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { ROLES, ORDER_STATUSES } = require('../core/stateMachine');

const getOperatorInfo = (req) => {
  return {
    role: req.headers['x-user-role'] || ROLES.OPERATOR,
    id: req.headers['x-user-id'] || 'SYSTEM'
  };
};

router.get('/', async (req, res) => {
  try {
    const { status, orderNo } = req.query;
    const exceptions = await orderService.getExceptions({
      status,
      orderNo
    });
    res.json({ success: true, data: exceptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:exceptionId/resolve', async (req, res) => {
  try {
    const { exceptionId } = req.params;
    const { resolution, target_status } = req.body;
    const operator = getOperatorInfo(req);
    
    if (!resolution || !target_status) {
      res.status(400).json({ success: false, error: 'resolution 和 target_status 为必填项' });
      return;
    }
    
    const result = await orderService.resolveException(
      exceptionId,
      resolution,
      target_status,
      operator.role,
      operator.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:exceptionId/retry', async (req, res) => {
  try {
    const { exceptionId } = req.params;
    const operator = getOperatorInfo(req);
    
    const result = await orderService.retryException(
      exceptionId,
      operator.role,
      operator.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
