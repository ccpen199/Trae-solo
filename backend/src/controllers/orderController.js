const orderService = require('../services/orderService');

const createOrder = (req, res) => {
  const orderData = req.body;
  const userId = req.user.id;
  
  if (!orderData.passengerId || !orderData.flightId) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  const result = orderService.createOrder(orderData, userId);
  if (result.error) {
    return res.status(500).json(result);
  }
  res.status(201).json(result);
};

const submitQuery = (req, res) => {
  const orderId = parseInt(req.params.id);
  const queryData = req.body;
  const userId = req.user.id;
  
  if (!orderId) {
    return res.status(400).json({ error: '无效的订单ID' });
  }
  
  const result = orderService.submitQuery(orderId, userId, queryData);
  if (result.error) {
    return res.status(500).json(result);
  }
  res.json(result);
};

const selectCabin = (req, res) => {
  const orderId = parseInt(req.params.id);
  const selectionData = req.body;
  const userId = req.user.id;
  
  if (!orderId) {
    return res.status(400).json({ error: '无效的订单ID' });
  }
  
  const result = orderService.selectCabin(orderId, userId, selectionData);
  if (result.error) {
    return res.status(500).json(result);
  }
  res.json(result);
};

const payAndIssue = (req, res) => {
  const orderId = parseInt(req.params.id);
  const paymentData = req.body;
  const userId = req.user.id;
  
  if (!orderId) {
    return res.status(400).json({ error: '无效的订单ID' });
  }
  
  const result = orderService.payAndIssue(orderId, userId, paymentData);
  if (result.error) {
    return res.status(500).json(result);
  }
  res.json(result);
};

const getOrderList = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const filters = {
    status: req.query.status,
    orderNumber: req.query.orderNumber,
    limit: req.query.limit
  };
  
  try {
    const orders = orderService.getOrderList(userId, role, filters);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOrderDetail = (req, res) => {
  const orderId = parseInt(req.params.id);
  const userId = req.user.id;
  const role = req.user.role;
  
  if (!orderId) {
    return res.status(400).json({ error: '无效的订单ID' });
  }
  
  const order = orderService.getOrderDetail(orderId, userId, role);
  if (order.error) {
    return res.status(404).json(order);
  }
  res.json(order);
};

const createRebookRefundRequest = (req, res) => {
  const orderId = parseInt(req.params.id);
  const requestData = req.body;
  const userId = req.user.id;
  
  if (!orderId || !requestData.requestType) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  const result = orderService.createRebookRefundRequest(orderId, userId, requestData);
  if (result.error) {
    return res.status(500).json(result);
  }
  res.json(result);
};

const processRebookRefund = (req, res) => {
  const requestId = parseInt(req.params.id);
  const actionData = req.body;
  const userId = req.user.id;
  
  if (!requestId || !actionData.action) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  const result = orderService.processRebookRefund(requestId, userId, actionData);
  if (result.error) {
    return res.status(500).json(result);
  }
  res.json(result);
};

const getTodoCount = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  
  try {
    const count = orderService.getTodoCount(userId, role);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createOrder,
  submitQuery,
  selectCabin,
  payAndIssue,
  getOrderList,
  getOrderDetail,
  createRebookRefundRequest,
  processRebookRefund,
  getTodoCount
};
