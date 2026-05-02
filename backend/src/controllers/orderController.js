const orderService = require('../services/orderService');
const statusFlowService = require('../services/statusFlowService');
const messageService = require('../services/messageService');

const createOrder = async (req, res) => {
  try {
    const { vehicleId, lockId, lat, lng } = req.body;
    const userId = req.user.id;
    
    if (!vehicleId || !lockId) {
      return res.status(400).json({
        success: false,
        message: '车辆ID和锁ID不能为空'
      });
    }
    
    const result = await orderService.createOrder(
      userId, 
      vehicleId, 
      lockId, 
      { lat, lng }
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '创建订单失败'
    });
  }
};

const startRide = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { lat, lng } = req.body;
    const userId = req.user.id;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '订单ID不能为空'
      });
    }
    
    const result = await orderService.startRide(
      orderId, 
      userId, 
      { lat, lng }
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '开始骑行失败'
    });
  }
};

const endRide = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { lat, lng } = req.body;
    const userId = req.user.id;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '订单ID不能为空'
      });
    }
    
    const result = await orderService.endRide(
      orderId, 
      userId, 
      { lat, lng }
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '结束骑行失败'
    });
  }
};

const confirmBilling = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const result = await orderService.confirmBilling(orderId, userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '确认计费失败'
    });
  }
};

const payOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const result = await orderService.payOrder(orderId, userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '支付失败'
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const order = await orderService.getOrderById(orderId, userId, userRole);
    
    const statusFlows = await statusFlowService.getStatusFlows('order', orderId);
    
    res.json({
      success: true,
      data: {
        order,
        statusFlows
      }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || '订单不存在'
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const orders = await orderService.getOrders(userId, userRole, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取订单列表失败'
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    const stats = await orderService.getDashboardStats(userRole);
    
    const unreadCount = await messageService.getUnreadCount(req.user.id, userRole);
    
    res.json({
      success: true,
      data: {
        ...stats,
        unreadMessages: unreadCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取统计数据失败'
    });
  }
};

module.exports = {
  createOrder,
  startRide,
  endRide,
  confirmBilling,
  payOrder,
  getOrderById,
  getOrders,
  getDashboardStats
};
