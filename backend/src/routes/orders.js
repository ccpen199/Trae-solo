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
    const { status, userRole, currentResponsibleRole, limit } = req.query;
    const orders = await orderService.getOrders({
      status,
      userRole,
      currentResponsibleRole,
      limit: limit ? parseInt(limit) : undefined
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const stats = await orderService.getStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const operator = getOperatorInfo(req);
    const orderData = {
      ...req.body,
      user_id: req.body.user_id || operator.id,
      user_role: req.body.user_role || operator.role
    };
    const result = await orderService.createOrder(orderData);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:orderNo', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const order = await orderService.getOrderByNo(orderNo);
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:orderNo/submit-location', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const operator = getOperatorInfo(req);
    const result = await orderService.submitLocation(
      orderNo,
      req.body,
      operator.role,
      operator.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:orderNo/plan-route', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const result = await orderService.planRoute(orderNo);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:orderNo/routes', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const routes = await orderService.getRouteSelections(orderNo);
    res.json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:orderNo/approve-route', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const { route_id, driver_id } = req.body;
    const operator = getOperatorInfo(req);
    
    if (!route_id || !driver_id) {
      res.status(400).json({ success: false, error: 'route_id 和 driver_id 为必填项' });
      return;
    }
    
    const result = await orderService.approveRoute(
      orderNo,
      route_id,
      driver_id,
      operator.role,
      operator.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:orderNo/reject-route', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const { reject_reason } = req.body;
    const operator = getOperatorInfo(req);
    
    if (!reject_reason) {
      res.status(400).json({ success: false, error: 'reject_reason 为必填项' });
      return;
    }
    
    const result = await orderService.rejectRoute(
      orderNo,
      reject_reason,
      operator.role,
      operator.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:orderNo/update-location', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const operator = getOperatorInfo(req);
    const result = await orderService.updateLocation(
      orderNo,
      req.body,
      operator.role,
      operator.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:orderNo/trajectories', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const trajectories = await orderService.getTrajectories(orderNo);
    res.json({ success: true, data: trajectories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:orderNo/complete-navigation', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const operator = getOperatorInfo(req);
    const result = await orderService.completeNavigation(
      orderNo,
      req.body,
      operator.role,
      operator.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:orderNo/lock-poi', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const { poi_id } = req.body;
    const operator = getOperatorInfo(req);
    
    if (!poi_id) {
      res.status(400).json({ success: false, error: 'poi_id 为必填项' });
      return;
    }
    
    const result = await orderService.lockPOI(
      orderNo,
      poi_id,
      operator.role,
      operator.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:orderNo/unlock-poi', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const { poi_id } = req.body;
    const operator = getOperatorInfo(req);
    
    if (!poi_id) {
      res.status(400).json({ success: false, error: 'poi_id 为必填项' });
      return;
    }
    
    const result = await orderService.unlockPOI(
      orderNo,
      poi_id,
      operator.role,
      operator.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:orderNo/confirm-arrival', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const operator = getOperatorInfo(req);
    const result = await orderService.confirmArrival(
      orderNo,
      req.body,
      operator.role,
      operator.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:orderNo/cancel', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const { cancel_reason } = req.body;
    const operator = getOperatorInfo(req);
    
    if (!cancel_reason) {
      res.status(400).json({ success: false, error: 'cancel_reason 为必填项' });
      return;
    }
    
    const result = await orderService.cancelOrder(
      orderNo,
      cancel_reason,
      operator.role,
      operator.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
