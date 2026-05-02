const db = require('../models/database');
const dayjs = require('dayjs');
const { 
  generateOrderNo, 
  generatePaymentNo, 
  validateStatusTransition, 
  getStatusName,
  getAvailableActions,
  buildPagination,
  checkConcurrency
} = require('../utils/helpers');
const { 
  createOperationLog, 
  createMessage, 
  createTimeline, 
  getTollCollectors, 
  getOperators,
  getFinanceUsers,
  createException
} = require('../middleware/auth');
const { generateBillingDetails, checkMonthlyCard } = require('../engines/billingEngine');

const createEntryOrder = async (req, res) => {
  try {
    const { 
      plateNumber, 
      vehicleType = 'car', 
      imagePath, 
      confidence, 
      lat, 
      lng, 
      gateId,
      remark,
      expectedCompleteTime
    } = req.body;
    const user = req.user;

    if (!plateNumber) {
      return res.status(400).json({ 
        success: false, 
        message: '车牌号不能为空' 
      });
    }

    const existingOrder = db.prepare(`
      SELECT * FROM orders 
      WHERE plate_number = ? AND status NOT IN ('completed', 'cancelled')
    `).get(plateNumber);

    if (existingOrder) {
      return res.status(400).json({ 
        success: false, 
        message: `该车辆已有进行中的订单: ${existingOrder.order_no}` 
      });
    }

    const orderNo = generateOrderNo();
    const entryTime = dayjs().format();

    const monthlyCard = checkMonthlyCard(plateNumber);

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_no, plate_number, vehicle_type, status, 
        entry_time, current_handler, monthly_card_id,
        remark, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tollCollectors = getTollCollectors();
    const currentHandler = tollCollectors.length > 0 ? tollCollectors[0].id : user.id;

    const monthlyCardId = monthlyCard ? monthlyCard.id : null;

    const orderResult = insertOrder.run(
      orderNo, plateNumber, vehicleType, 'pending_parking',
      entryTime, currentHandler, monthlyCardId,
      remark, user.id
    );

    const orderId = orderResult.lastInsertRowid;

    const insertRecognition = db.prepare(`
      INSERT INTO license_plate_records (
        order_id, plate_number, recognition_time, image_path,
        confidence, location_lat, location_lng, gate_id,
        operator_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertRecognition.run(
      orderId, plateNumber, entryTime, imagePath,
      confidence, lat, lng, gateId,
      user.id, 'confirmed'
    );

    const insertDetail = db.prepare(`
      INSERT INTO order_details (
        order_id, detail_type, description, status, handler
      ) VALUES (?, ?, ?, ?, ?)
    `);

    insertDetail.run(
      orderId, 'entry', 
      `车牌识别入场: ${plateNumber}`, 
      'completed', user.id
    );

    createTimeline(
      orderId, 'entry', '车牌入场',
      `车辆 ${plateNumber} 入场成功`,
      user.id, user.name,
      null, 'pending_parking',
      `入场时间: ${entryTime}`
    );

    tollCollectors.forEach(toll => {
      createMessage(
        toll.id, orderId, 'todo',
        '待车位停放',
        `车辆 ${plateNumber} 入场，等待停放确认`,
        true
      );
    });

    createOperationLog(
      req, 'create_order', 'order',
      null,
      { orderNo, plateNumber, status: 'pending_parking' },
      `创建入场订单: ${orderNo}`
    );

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    res.json({
      success: true,
      message: '入场成功',
      data: {
        order,
        monthlyCard: monthlyCard ? {
          id: monthlyCard.id,
          cardNo: monthlyCard.card_no,
          endDate: monthlyCard.end_date
        } : null,
        isMonthlyCard: !!monthlyCard
      }
    });
  } catch (error) {
    console.error('创建入场订单错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误', 
      error: error.message 
    });
  }
};

const confirmParking = async (req, res) => {
  try {
    const { orderId, parkingSpaceId, version = 1 } = req.body;
    const user = req.user;

    if (!orderId || !parkingSpaceId) {
      return res.status(400).json({ 
        success: false, 
        message: '订单ID和车位ID不能为空' 
      });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: '订单不存在' 
      });
    }

    if (order.status !== 'pending_parking') {
      return res.status(400).json({ 
        success: false, 
        message: `当前订单状态为${getStatusName(order.status)}，无法进行停放确认` 
      });
    }

    const concurrencyCheck = checkConcurrency(db, 'orders', orderId, version);
    if (!concurrencyCheck.success) {
      return res.status(409).json(concurrencyCheck);
    }

    const parkingSpace = db.prepare('SELECT * FROM parking_spaces WHERE id = ?').get(parkingSpaceId);
    
    if (!parkingSpace) {
      return res.status(404).json({ 
        success: false, 
        message: '车位不存在' 
      });
    }

    if (parkingSpace.status !== 'available') {
      return res.status(400).json({ 
        success: false, 
        message: `车位 ${parkingSpace.space_no} 已被占用` 
      });
    }

    db.prepare(`
      UPDATE orders 
      SET status = 'pending_billing', 
          parking_space_id = ?, 
          current_handler = ?,
          updated_at = CURRENT_TIMESTAMP,
          version = version + 1
      WHERE id = ?
    `).run(parkingSpaceId, user.id, orderId);

    db.prepare(`
      UPDATE parking_spaces 
      SET status = 'occupied', 
          current_order_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(orderId, parkingSpaceId);

    const insertDetail = db.prepare(`
      INSERT INTO order_details (
        order_id, detail_type, description, status, handler, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const now = dayjs().format();
    insertDetail.run(
      orderId, 'parking', 
      `车辆停放在车位: ${parkingSpace.space_no}`, 
      'completed', user.id, now
    );

    createTimeline(
      orderId, 'parking', '车位停放确认',
      `车辆 ${order.plate_number} 停放在车位 ${parkingSpace.space_no}`,
      user.id, user.name,
      'pending_parking', 'pending_billing',
      `车位: ${parkingSpace.space_no}`
    );

    db.prepare(`
      UPDATE messages 
      SET status = 'read', read_at = CURRENT_TIMESTAMP 
      WHERE order_id = ? AND is_todo = 1
    `).run(orderId);

    getOperators().forEach(op => {
      createMessage(
        op.id, orderId, 'todo',
        '待出场计费',
        `车辆 ${order.plate_number} 已停放，等待出场计费`,
        true
      );
    });

    createOperationLog(
      req, 'confirm_parking', 'order',
      { status: order.status, parkingSpaceId: order.parking_space_id },
      { status: 'pending_billing', parkingSpaceId },
      `确认车位停放: ${parkingSpace.space_no}`
    );

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    res.json({
      success: true,
      message: '停放确认成功',
      data: {
        order: updatedOrder,
        parkingSpace
      }
    });
  } catch (error) {
    console.error('确认停放错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误', 
      error: error.message 
    });
  }
};

const processBilling = async (req, res) => {
  try {
    const { orderId, action, remark, supplementReason, reassignUserId } = req.body;
    const user = req.user;

    if (!orderId || !action) {
      return res.status(400).json({ 
        success: false, 
        message: '订单ID和操作类型不能为空' 
      });
    }

    const validActions = ['approve', 'reject', 'supplement', 'reassign'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的操作类型' 
      });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: '订单不存在' 
      });
    }

    if (order.status !== 'pending_billing') {
      return res.status(400).json({ 
        success: false, 
        message: `当前订单状态为${getStatusName(order.status)}，无法进行计费处理` 
      });
    }

    const billingDetails = generateBillingDetails(orderId);
    
    if (!billingDetails.success) {
      return res.status(400).json(billingDetails);
    }

    const now = dayjs().format();
    let newStatus = order.status;
    let messageTitle = '';
    let messageContent = '';
    let timelineTitle = '';
    let timelineContent = '';

    switch (action) {
      case 'approve':
        newStatus = 'pending_payment';
        messageTitle = '待支付抬杆';
        messageContent = `车辆 ${order.plate_number} 计费通过，金额: ¥${billingDetails.totalAmount}`;
        timelineTitle = '计费通过';
        timelineContent = `计费审核通过，停车时长: ${billingDetails.duration}分钟，应付: ¥${billingDetails.totalAmount}`;

        if (billingDetails.totalAmount > 0) {
          const paymentNo = generatePaymentNo();
          db.prepare(`
            INSERT INTO payments (payment_no, order_id, amount, status, operator_id)
            VALUES (?, ?, ?, 'pending', ?)
          `).run(paymentNo, orderId, billingDetails.totalAmount, user.id);
        }

        db.prepare(`
          UPDATE orders 
          SET total_amount = ?, 
              exit_time = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(billingDetails.totalAmount, now, orderId);
        break;

      case 'reject':
        newStatus = 'pending_entry';
        messageTitle = '计费被驳回';
        messageContent = `车辆 ${order.plate_number} 计费被驳回，请重新处理`;
        timelineTitle = '计费驳回';
        timelineContent = remark || '计费审核被驳回';
        
        if (order.parking_space_id) {
          db.prepare(`
            UPDATE parking_spaces 
            SET status = 'available', current_order_id = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(order.parking_space_id);
        }
        break;

      case 'supplement':
        messageTitle = '需要补充资料';
        messageContent = `车辆 ${order.plate_number} 需要补充资料: ${supplementReason || remark}`;
        timelineTitle = '要求补充资料';
        timelineContent = supplementReason || remark;
        break;

      case 'reassign':
        if (!reassignUserId) {
          return res.status(400).json({ 
            success: false, 
            message: '转派必须指定接收人' 
          });
        }
        
        const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(reassignUserId);
        if (!targetUser) {
          return res.status(404).json({ 
            success: false, 
            message: '转派目标用户不存在' 
          });
        }

        db.prepare(`
          UPDATE orders 
          SET current_handler = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(reassignUserId, orderId);

        messageTitle = '订单已转派';
        messageContent = `订单已转派给: ${targetUser.name}`;
        timelineTitle = '订单转派';
        timelineContent = `转派给: ${targetUser.name}，原因: ${remark || '无'}`;

        createMessage(
          reassignUserId, orderId, 'todo',
          '待处理转派订单',
          `车辆 ${order.plate_number} 被转派给您处理`,
          true
        );
        break;
    }

    if (action !== 'supplement' && action !== 'reassign') {
      db.prepare(`
        UPDATE orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStatus, orderId);

      db.prepare(`
        UPDATE messages 
        SET status = 'read', read_at = CURRENT_TIMESTAMP 
        WHERE order_id = ? AND is_todo = 1
      `).run(orderId);
    }

    createTimeline(
      orderId, 'billing', timelineTitle,
      timelineContent,
      user.id, user.name,
      order.status, newStatus,
      remark || ''
    );

    const notificationUsers = action === 'approve' ? getTollCollectors() : getOperators();
    if (action !== 'reassign') {
      notificationUsers.forEach(u => {
        createMessage(u.id, orderId, action === 'approve' ? 'todo' : 'info', messageTitle, messageContent, action === 'approve');
      });
    }

    createOperationLog(
      req, `billing_${action}`, 'order',
      { status: order.status },
      { status: newStatus, billingDetails },
      `计费处理: ${action}`
    );

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    res.json({
      success: true,
      message: '计费处理成功',
      data: {
        order: updatedOrder,
        billingDetails,
        action
      }
    });
  } catch (error) {
    console.error('计费处理错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误', 
      error: error.message 
    });
  }
};

const processPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod = 'wechat', transactionId } = req.body;
    const user = req.user;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: '订单ID不能为空' 
      });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: '订单不存在' 
      });
    }

    if (order.status !== 'pending_payment') {
      return res.status(400).json({ 
        success: false, 
        message: `当前订单状态为${getStatusName(order.status)}，无法支付` 
      });
    }

    const now = dayjs().format();

    if (order.total_amount > 0) {
      const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(orderId);
      
      if (payment) {
        db.prepare(`
          UPDATE payments 
          SET status = 'paid', 
              payment_method = ?,
              transaction_id = ?,
              paid_at = ?,
              operator_id = ?
          WHERE id = ?
        `).run(paymentMethod, transactionId, now, user.id, payment.id);
      }
    }

    db.prepare(`
      UPDATE orders 
      SET status = 'pending_reconciliation', 
          paid_amount = total_amount,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(orderId);

    if (order.parking_space_id) {
      db.prepare(`
        UPDATE parking_spaces 
        SET status = 'available', 
            current_order_id = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(order.parking_space_id);
    }

    const insertDetail = db.prepare(`
      INSERT INTO order_details (
        order_id, detail_type, description, amount, status, handler, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertDetail.run(
      orderId, 'payment', 
      `支付完成，支付方式: ${paymentMethod}`, 
      order.total_amount, 'completed', user.id, now
    );

    createTimeline(
      orderId, 'payment', '支付抬杆',
      `车辆 ${order.plate_number} 支付完成，金额: ¥${order.total_amount}`,
      user.id, user.name,
      'pending_payment', 'pending_reconciliation',
      `支付方式: ${paymentMethod}`
    );

    db.prepare(`
      UPDATE messages 
      SET status = 'read', read_at = CURRENT_TIMESTAMP 
      WHERE order_id = ? AND is_todo = 1
    `).run(orderId);

    getFinanceUsers().forEach(finance => {
      createMessage(
        finance.id, orderId, 'todo',
        '待对账',
        `车辆 ${order.plate_number} 支付完成，等待对账，金额: ¥${order.total_amount}`,
        true
      );
    });

    createOperationLog(
      req, 'payment', 'order',
      { status: order.status, paidAmount: order.paid_amount },
      { status: 'pending_reconciliation', paidAmount: order.total_amount },
      `支付完成: ¥${order.total_amount}`
    );

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    res.json({
      success: true,
      message: '支付成功，已抬杆',
      data: {
        order: updatedOrder
      }
    });
  } catch (error) {
    console.error('支付处理错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误', 
      error: error.message 
    });
  }
};

const processReconciliation = async (req, res) => {
  try {
    const { orderId, remark } = req.body;
    const user = req.user;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: '订单ID不能为空' 
      });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: '订单不存在' 
      });
    }

    if (order.status !== 'pending_reconciliation') {
      return res.status(400).json({ 
        success: false, 
        message: `当前订单状态为${getStatusName(order.status)}，无法对账` 
      });
    }

    const payments = db.prepare('SELECT * FROM payments WHERE order_id = ?').all(orderId);
    
    for (const payment of payments) {
      if (payment.is_locked) {
        return res.status(400).json({ 
          success: false, 
          message: '支付已被锁定，无法重复对账' 
        });
      }

      db.prepare(`
        UPDATE payments 
        SET is_locked = 1, 
            locked_at = CURRENT_TIMESTAMP,
            locked_by = ?
        WHERE id = ?
      `).run(user.id, payment.id);
    }

    const now = dayjs().format();

    db.prepare(`
      UPDATE orders 
      SET status = 'completed', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(orderId);

    createTimeline(
      orderId, 'reconciliation', '对账完成',
      `车辆 ${order.plate_number} 对账完成，金额: ¥${order.total_amount}`,
      user.id, user.name,
      'pending_reconciliation', 'completed',
      remark || ''
    );

    db.prepare(`
      UPDATE messages 
      SET status = 'read', read_at = CURRENT_TIMESTAMP 
      WHERE order_id = ? AND is_todo = 1
    `).run(orderId);

    const operators = getOperators();
    operators.forEach(op => {
      createMessage(
        op.id, orderId, 'info',
        '订单完成',
        `车辆 ${order.plate_number} 订单已完成，金额: ¥${order.total_amount}`,
        false
      );
    });

    createOperationLog(
      req, 'reconciliation', 'order',
      { status: order.status },
      { status: 'completed' },
      `对账完成`
    );

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    res.json({
      success: true,
      message: '对账完成',
      data: {
        order: updatedOrder,
        payments
      }
    });
  } catch (error) {
    console.error('对账处理错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误', 
      error: error.message 
    });
  }
};

module.exports = {
  createEntryOrder,
  confirmParking,
  processBilling,
  processPayment,
  processReconciliation
};