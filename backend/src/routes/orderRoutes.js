const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database/init');
const DispatchEngine = require('../engines/dispatchEngine');
const PricingEngine = require('../engines/pricingEngine');
const GeofenceEngine = require('../engines/geofenceEngine');
const CapacityEngine = require('../engines/capacityEngine');
const StateSyncService = require('../services/stateSyncService');
const ExceptionService = require('../services/exceptionService');
const ReportService = require('../services/reportService');

const ORDER_STATUSES = {
  PENDING: 'pending',
  DRIVER_ASSIGNED: 'driver_assigned',
  DRIVER_ACCEPTED: 'driver_accepted',
  IN_PROGRESS: 'in_progress',
  ARRIVED: 'arrived',
  PAYMENT_COMPLETED: 'payment_completed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXCEPTION: 'exception'
};

const generateOrderNo = () => {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
                  (date.getMonth() + 1).toString().padStart(2, '0') +
                  date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${dateStr}${random}`;
};

router.post('/create', async (req, res) => {
  try {
    const { 
      passenger_id, 
      start_address, 
      start_lat, 
      start_lng,
      end_address,
      end_lat,
      end_lng,
      ride_type = 'standard',
      passenger_note,
      expected_complete_time
    } = req.body;

    const validation = DispatchEngine.validateOrderFields({
      passenger_id,
      start_address,
      start_lat,
      start_lng,
      end_address,
      end_lat,
      end_lng
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    if (DispatchEngine.checkDuplicateOrder(passenger_id)) {
      return res.status(400).json({
        success: false,
        error: '您有进行中的订单，请勿重复下单'
      });
    }

    const etaInfo = GeofenceEngine.calculateETA(start_lat, start_lng, end_lat, end_lng);
    const priceInfo = PricingEngine.calculateEstimatedPrice(etaInfo.distance, ride_type);

    const orderId = uuidv4();
    const orderNo = generateOrderNo();

    db.prepare(`
      INSERT INTO order_main (
        id, order_no, passenger_id,
        start_address, start_lat, start_lng,
        end_address, end_lat, end_lng,
        expected_eta, estimated_distance, estimated_price,
        status, ride_type, passenger_note, expected_complete_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId, orderNo, passenger_id,
      start_address, start_lat, start_lng,
      end_address, end_lat, end_lng,
      etaInfo.estimatedMinutes, etaInfo.distance, priceInfo.estimatedPrice,
      ORDER_STATUSES.PENDING, ride_type, passenger_note, expected_complete_time
    );

    const order = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);

    StateSyncService.createOrderDetail(orderId, 'eta_info', etaInfo);
    StateSyncService.createOrderDetail(orderId, 'price_estimate', priceInfo);

    StateSyncService.syncStateOnStatusChange(
      order, ORDER_STATUSES.PENDING, null, 'system', '订单创建'
    );

    StateSyncService.createAuditLog(
      null, 'passenger', 'order_created',
      'order', orderId,
      null, order
    );

    res.json({
      success: true,
      order: {
        ...order,
        eta_info: etaInfo,
        price_estimate: priceInfo
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: '创建订单失败'
    });
  }
});

router.get('/available-drivers', async (req, res) => {
  try {
    const { lat, lng, ride_type } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: '缺少坐标参数'
      });
    }

    const drivers = DispatchEngine.getAvailableDrivers(
      parseFloat(lat), 
      parseFloat(lng), 
      ride_type
    );

    res.json({
      success: true,
      drivers
    });
  } catch (error) {
    console.error('Get available drivers error:', error);
    res.status(500).json({
      success: false,
      error: '获取可用司机失败'
    });
  }
});

router.post('/:orderId/assign-driver', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driver_id, operator_id, operator_role } = req.body;

    const order = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if (order.status !== ORDER_STATUSES.PENDING) {
      return res.status(400).json({
        success: false,
        error: '订单状态不允许派单'
      });
    }

    let driver = null;
    if (driver_id) {
      driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
      if (!driver || driver.status !== 'idle') {
        return res.status(400).json({
          success: false,
          error: '指定司机不可用'
        });
      }
    }

    const dispatchResult = DispatchEngine.dispatchOrder(order, driver);

    if (!dispatchResult.success) {
      return res.status(400).json({
        success: false,
        error: dispatchResult.error
      });
    }

    const updatedOrder = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);

    StateSyncService.syncStateOnStatusChange(
      order, ORDER_STATUSES.DRIVER_ASSIGNED, operator_id, operator_role, '司机已分配'
    );

    StateSyncService.createAuditLog(
      operator_id, operator_role, 'driver_assigned',
      'order', orderId,
      { driver_id: null }, { driver_id: dispatchResult.driver.id }
    );

    res.json({
      success: true,
      order: updatedOrder,
      driver: dispatchResult.driver,
      eta: dispatchResult.eta
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({
      success: false,
      error: '派单失败'
    });
  }
});

router.post('/:orderId/driver-accept', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driver_id, operator_id, operator_role } = req.body;

    const order = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if (order.driver_id !== driver_id) {
      return res.status(403).json({
        success: false,
        error: '您不是该订单的司机'
      });
    }

    if (order.status !== ORDER_STATUSES.DRIVER_ASSIGNED) {
      return res.status(400).json({
        success: false,
        error: '订单状态不允许接单'
      });
    }

    db.prepare(`
      UPDATE order_main 
      SET status = ?, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(ORDER_STATUSES.DRIVER_ACCEPTED, orderId);

    db.prepare(`
      UPDATE drivers 
      SET status = 'in_ride', updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(driver_id);

    const updatedOrder = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);

    StateSyncService.syncStateOnStatusChange(
      order, ORDER_STATUSES.DRIVER_ACCEPTED, operator_id, operator_role, '司机已接单'
    );

    StateSyncService.createAuditLog(
      operator_id, operator_role, 'driver_accepted',
      'order', orderId,
      { status: order.status }, { status: ORDER_STATUSES.DRIVER_ACCEPTED }
    );

    res.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Driver accept error:', error);
    res.status(500).json({
      success: false,
      error: '接单失败'
    });
  }
});

router.post('/:orderId/start-ride', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driver_id, operator_id, operator_role, start_lat, start_lng } = req.body;

    const order = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if (order.driver_id !== driver_id) {
      return res.status(403).json({
        success: false,
        error: '您不是该订单的司机'
      });
    }

    if (order.status !== ORDER_STATUSES.DRIVER_ACCEPTED) {
      return res.status(400).json({
        success: false,
        error: '订单状态不允许开始行程'
      });
    }

    db.prepare(`
      UPDATE order_main 
      SET status = ?, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(ORDER_STATUSES.IN_PROGRESS, orderId);

    StateSyncService.createOrderDetail(orderId, 'ride_started', {
      start_lat,
      start_lng,
      timestamp: Date.now()
    });

    const updatedOrder = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);

    StateSyncService.syncStateOnStatusChange(
      order, ORDER_STATUSES.IN_PROGRESS, operator_id, operator_role, '行程开始'
    );

    StateSyncService.createAuditLog(
      operator_id, operator_role, 'ride_started',
      'order', orderId,
      { status: order.status }, { status: ORDER_STATUSES.IN_PROGRESS }
    );

    res.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Start ride error:', error);
    res.status(500).json({
      success: false,
      error: '开始行程失败'
    });
  }
});

router.post('/:orderId/confirm-arrival', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driver_id, operator_id, operator_role, end_lat, end_lng, actual_distance } = req.body;

    const order = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if (order.driver_id !== driver_id) {
      return res.status(403).json({
        success: false,
        error: '您不是该订单的司机'
      });
    }

    if (order.status !== ORDER_STATUSES.IN_PROGRESS) {
      return res.status(400).json({
        success: false,
        error: '订单状态不允许确认到达'
      });
    }

    const finalDistance = actual_distance || order.estimated_distance;
    const actualDuration = Math.floor(Date.now() / 1000) - order.created_at;
    const priceInfo = PricingEngine.calculateActualPrice(
      order, finalDistance, actualDuration
    );

    db.prepare(`
      UPDATE order_main 
      SET status = ?, 
          actual_distance = ?,
          actual_price = ?,
          updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(ORDER_STATUSES.ARRIVED, finalDistance, priceInfo.actualPrice, orderId);

    db.prepare(`
      UPDATE drivers 
      SET status = 'idle', updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(driver_id);

    StateSyncService.createOrderDetail(orderId, 'arrival_info', {
      end_lat,
      end_lng,
      actual_distance: finalDistance,
      actual_duration: actualDuration,
      price_info: priceInfo,
      timestamp: Date.now()
    });

    const updatedOrder = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);

    StateSyncService.syncStateOnStatusChange(
      order, ORDER_STATUSES.ARRIVED, operator_id, operator_role, '已到达目的地'
    );

    StateSyncService.createAuditLog(
      operator_id, operator_role, 'arrival_confirmed',
      'order', orderId,
      { status: order.status }, { status: ORDER_STATUSES.ARRIVED, actual_price: priceInfo.actualPrice }
    );

    res.json({
      success: true,
      order: updatedOrder,
      price_info: priceInfo
    });
  } catch (error) {
    console.error('Confirm arrival error:', error);
    res.status(500).json({
      success: false,
      error: '确认到达失败'
    });
  }
});

router.post('/:orderId/payment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { passenger_id, payment_method, operator_id, operator_role } = req.body;

    const order = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if (order.passenger_id !== passenger_id) {
      return res.status(403).json({
        success: false,
        error: '您不是该订单的乘客'
      });
    }

    if (order.status !== ORDER_STATUSES.ARRIVED) {
      return res.status(400).json({
        success: false,
        error: '订单状态不允许支付'
      });
    }

    const paymentId = uuidv4();
    db.prepare(`
      INSERT INTO payments (
        id, order_id, passenger_id, driver_id,
        amount, payment_method, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      paymentId, orderId, passenger_id, order.driver_id,
      order.actual_price, payment_method, 'completed'
    );

    db.prepare(`
      UPDATE order_main 
      SET status = ?, payment_status = 'completed', updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(ORDER_STATUSES.PAYMENT_COMPLETED, orderId);

    StateSyncService.createOrderDetail(orderId, 'payment_info', {
      payment_id: paymentId,
      payment_method,
      amount: order.actual_price,
      timestamp: Date.now()
    });

    const updatedOrder = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);

    StateSyncService.syncStateOnStatusChange(
      order, ORDER_STATUSES.PAYMENT_COMPLETED, operator_id, operator_role, '支付完成'
    );

    StateSyncService.createAuditLog(
      operator_id, operator_role, 'payment_completed',
      'order', orderId,
      { status: order.status, payment_status: order.payment_status },
      { status: ORDER_STATUSES.PAYMENT_COMPLETED, payment_status: 'completed' }
    );

    res.json({
      success: true,
      order: updatedOrder,
      payment: {
        id: paymentId,
        amount: order.actual_price,
        payment_method,
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      success: false,
      error: '支付失败'
    });
  }
});

router.post('/:orderId/rate', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { user_id, user_role, rating, content, action } = req.body;

    const order = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const commentId = uuidv4();
    db.prepare(`
      INSERT INTO comments_approvals (
        id, order_id, user_id, user_role,
        action, content, rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      commentId, orderId, user_id, user_role,
      action || 'rate', content, rating
    );

    db.prepare(`
      UPDATE order_main 
      SET status = ?, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(ORDER_STATUSES.COMPLETED, orderId);

    const updatedOrder = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);

    StateSyncService.syncStateOnStatusChange(
      order, ORDER_STATUSES.COMPLETED, user_id, user_role, '订单完成'
    );

    StateSyncService.createAuditLog(
      user_id, user_role, 'rating_submitted',
      'order', orderId,
      null, { rating, content }
    );

    res.json({
      success: true,
      order: updatedOrder,
      comment: {
        id: commentId,
        rating,
        content,
        action
      }
    });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({
      success: false,
      error: '评价失败'
    });
  }
});

router.post('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { user_id, user_role, reason } = req.body;

    const order = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if ([ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: '订单已完成或已取消'
      });
    }

    const cancelTime = Math.floor(Date.now() / 1000);
    const cancellationFee = PricingEngine.calculateCancellationFee(order, cancelTime);

    db.prepare(`
      UPDATE order_main 
      SET status = ?, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(ORDER_STATUSES.CANCELLED, orderId);

    if (order.driver_id) {
      db.prepare(`
        UPDATE drivers 
        SET status = 'idle', updated_at = strftime('%s', 'now')
        WHERE id = ?
      `).run(order.driver_id);
    }

    StateSyncService.createOrderDetail(orderId, 'cancellation_info', {
      cancelled_by: user_id,
      cancelled_role: user_role,
      reason,
      cancellation_fee: cancellationFee,
      timestamp: Date.now()
    });

    const updatedOrder = db.prepare('SELECT * FROM order_main WHERE id = ?').get(orderId);

    StateSyncService.syncStateOnStatusChange(
      order, ORDER_STATUSES.CANCELLED, user_id, user_role, reason || '订单取消'
    );

    StateSyncService.createAuditLog(
      user_id, user_role, 'order_cancelled',
      'order', orderId,
      { status: order.status }, { status: ORDER_STATUSES.CANCELLED, reason }
    );

    res.json({
      success: true,
      order: updatedOrder,
      cancellation_fee: cancellationFee
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: '取消订单失败'
    });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderDetail = ReportService.getOrderDetailWithRelations(orderId);
    
    if (!orderDetail) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    res.json({
      success: true,
      ...orderDetail
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({
      success: false,
      error: '获取订单详情失败'
    });
  }
});

router.get('/passenger/:passengerId/orders', async (req, res) => {
  try {
    const { passengerId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT om.*,
             u.name as driver_name,
             d.car_model,
             d.car_plate
      FROM order_main om
      LEFT JOIN drivers d ON om.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE om.passenger_id = ?
    `;
    const params = [passengerId];

    if (status && status !== 'all') {
      query += ' AND om.status = ?';
      params.push(status);
    }

    query += ' ORDER BY om.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = db.prepare(query).all(...params);

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get passenger orders error:', error);
    res.status(500).json({
      success: false,
      error: '获取订单列表失败'
    });
  }
});

router.get('/driver/:driverId/orders', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT om.*,
             u.name as passenger_name,
             u.phone as passenger_phone
      FROM order_main om
      JOIN passengers p ON om.passenger_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE om.driver_id = ?
    `;
    const params = [driverId];

    if (status && status !== 'all') {
      query += ' AND om.status = ?';
      params.push(status);
    }

    query += ' ORDER BY om.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = db.prepare(query).all(...params);

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get driver orders error:', error);
    res.status(500).json({
      success: false,
      error: '获取订单列表失败'
    });
  }
});

module.exports = router;
