const express = require('express');
const { authMiddleware, roleMiddleware } = require('./auth');
const orderService = require('../services/orderService');
const db = require('../database/init');
const { ORDER_STATUS, STATUS_NAMES, ROLE_NAMES, STATE_TRANSITIONS } = require('../utils/constants');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const { status, order_no, page = 1, pageSize = 20 } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (order_no) filters.order_no = order_no;
    
    if (req.user.role === 'DRIVER') {
      filters.assigned_driver_id = req.user.userId;
    } else if (req.user.role === 'USER') {
      filters.user_id = req.user.userId;
    }

    const result = orderService.getOrders(filters, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message,
    });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const order = orderService.getOrderById(req.params.id);
    
    if (req.user.role === 'DRIVER' && order.assigned_driver_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '没有权限访问此订单',
      });
    }
    if (req.user.role === 'USER' && order.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '没有权限访问此订单',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message,
    });
  }
});

router.post('/', authMiddleware, roleMiddleware('USER', 'DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const result = orderService.createOrder(
      req.user.userId,
      {
        ...req.body,
        userName: req.user.username,
        userRole: req.user.role,
      }
    );

    res.json({
      success: true,
      data: result,
      message: '订单创建成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error.message,
    });
  }
});

router.post('/:id/submit-location', authMiddleware, roleMiddleware('USER', 'DISPATCHER'), (req, res) => {
  try {
    const result = orderService.submitLocation(
      req.params.id,
      req.user.userId,
      {
        ...req.body,
        userName: req.user.username,
        userRole: req.user.role,
      }
    );

    res.json({
      success: true,
      data: result,
      message: '位置提交成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提交位置失败',
      error: error.message,
    });
  }
});

router.post('/:id/plan-route', authMiddleware, roleMiddleware('DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const result = orderService.planRoute(
      req.params.id,
      req.user.userId,
      {
        ...req.body,
        userName: req.user.username,
        userRole: req.user.role,
      }
    );

    res.json({
      success: true,
      data: result,
      message: '路线规划完成',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '路线规划失败',
      error: error.message,
    });
  }
});

router.post('/:id/approve-route', authMiddleware, roleMiddleware('DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const result = orderService.approveRoute(
      req.params.id,
      req.user.userId,
      {
        ...req.body,
        userName: req.user.username,
        userRole: req.user.role,
      }
    );

    res.json({
      success: true,
      data: result,
      message: '路线审批通过',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '审批失败',
      error: error.message,
    });
  }
});

router.post('/:id/reject-route', authMiddleware, roleMiddleware('DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const result = orderService.rejectRoute(
      req.params.id,
      req.user.userId,
      {
        ...req.body,
        userName: req.user.username,
        userRole: req.user.role,
      }
    );

    res.json({
      success: true,
      data: result,
      message: '路线已驳回',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '驳回操作失败',
      error: error.message,
    });
  }
});

router.post('/:id/start-navigation', authMiddleware, roleMiddleware('DRIVER', 'DISPATCHER'), (req, res) => {
  try {
    const result = orderService.startNavigation(
      req.params.id,
      req.user.userId,
      {
        ...req.body,
        userName: req.user.username,
        userRole: req.user.role,
      }
    );

    res.json({
      success: true,
      data: result,
      message: '导航已开始',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '开始导航失败',
      error: error.message,
    });
  }
});

router.post('/:id/submit-track', authMiddleware, roleMiddleware('DRIVER', 'DISPATCHER'), (req, res) => {
  try {
    const result = orderService.submitTrack(
      req.params.id,
      req.user.userId,
      {
        ...req.body,
        userName: req.user.username,
        userRole: req.user.role,
      }
    );

    res.json({
      success: true,
      data: result,
      message: '轨迹提交成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提交轨迹失败',
      error: error.message,
    });
  }
});

router.post('/:id/confirm-arrival', authMiddleware, roleMiddleware('DRIVER', 'DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const result = orderService.confirmArrival(
      req.params.id,
      req.user.userId,
      {
        ...req.body,
        userName: req.user.username,
        userRole: req.user.role,
      }
    );

    res.json({
      success: true,
      data: result,
      message: '到达确认成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '确认到达失败',
      error: error.message,
    });
  }
});

router.post('/:id/cancel', authMiddleware, roleMiddleware('USER', 'DISPATCHER', 'OPERATOR'), (req, res) => {
  try {
    const result = orderService.cancelOrder(
      req.params.id,
      req.user.userId,
      {
        ...req.body,
        userName: req.user.username,
        userRole: req.user.role,
      }
    );

    res.json({
      success: true,
      data: result,
      message: '订单已取消',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '取消订单失败',
      error: error.message,
    });
  }
});

router.get('/:id/time-axis', authMiddleware, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM time_axis WHERE order_id = ? ORDER BY created_at');
    const timeAxis = stmt.all(req.params.id);

    res.json({
      success: true,
      data: timeAxis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取时间轴失败',
      error: error.message,
    });
  }
});

router.get('/:id/tracks', authMiddleware, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM tracks WHERE order_id = ? ORDER BY created_at');
    const tracks = stmt.all(req.params.id);

    res.json({
      success: true,
      data: tracks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取轨迹失败',
      error: error.message,
    });
  }
});

module.exports = router;
