const { db } = require('../database/init');
const { v4: uuidv4 } = require('uuid');
const InventoryService = require('./inventoryService');

class PaymentCenterService {
  
  static generateOrderNo() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `QNR${timestamp}${random}`;
  }

  static generateTransNo() {
    return `TRX${uuidv4().replace(/-/g, '').substring(0, 20)}`;
  }

  static createOrder(userId, businessLineId, originalAmount, levelDiscountAmount = 0, otherDiscountAmount = 0) {
    const orderNo = this.generateOrderNo();
    const payAmount = Math.max(0, originalAmount - levelDiscountAmount - otherDiscountAmount);
    
    const result = db.prepare(`
      INSERT INTO orders (order_no, user_id, business_line_id, original_amount, level_discount_amount, other_discount_amount, pay_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(orderNo, userId, businessLineId, originalAmount, levelDiscountAmount, otherDiscountAmount, payAmount);

    return {
      orderId: result.lastInsertRowid,
      orderNo,
      userId,
      businessLineId,
      originalAmount,
      levelDiscountAmount,
      otherDiscountAmount,
      payAmount,
      status: 'pending'
    };
  }

  static completePayment(orderId) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.status === 'paid') {
      return { success: true, message: '订单已支付', order };
    }

    db.prepare(`
      UPDATE orders 
      SET status = 'paid', payment_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(orderId);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    return { success: true, order: updatedOrder };
  }

  static distributePoints(orderId, customPointCoefficient = null) {
    const order = db.prepare(`
      SELECT o.*, bl.code as business_code, bl.name as business_name, bl.point_coefficient as default_point_coeff
      FROM orders o
      JOIN business_lines bl ON o.business_line_id = bl.id
      WHERE o.id = ?
    `).get(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.status !== 'paid') {
      throw new Error('订单未支付，无法发放积分');
    }

    const pointCoefficient = customPointCoefficient !== null ? customPointCoefficient : order.default_point_coeff;
    
    const basePoints = Math.floor(order.pay_amount / 100);
    const awardedPoints = Math.floor(basePoints * pointCoefficient);

    if (awardedPoints <= 0) {
      return { success: false, message: '支付金额不足以产生积分', awardedPoints: 0 };
    }

    const account = db.prepare(`
      SELECT * FROM business_point_accounts 
      WHERE business_line_id = ? AND status = 1
    `).get(order.business_line_id);

    if (!account || account.balance < awardedPoints) {
      throw new Error('业务线积分账户余额不足');
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(order.user_id);
    if (!user) {
      throw new Error('用户不存在');
    }

    const transNo = this.generateTransNo();
    const pointsBefore = user.available_points;
    const pointsAfter = pointsBefore + awardedPoints;

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO point_transactions (
          trans_no, user_id, order_id, business_line_id, account_id,
          points, points_before, points_after, trans_type, trans_desc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        transNo, order.user_id, orderId, order.business_line_id, account.id,
        awardedPoints, pointsBefore, pointsAfter, 'award',
        `${order.business_name}订单消费发放积分，订单号:${order.order_no}，支付金额:${order.pay_amount}分，积分系数:${pointCoefficient}`
      );

      db.prepare(`
        UPDATE users 
        SET total_points = total_points + ?, available_points = available_points + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(awardedPoints, awardedPoints, order.user_id);

      db.prepare(`
        UPDATE business_point_accounts 
        SET balance = balance - ?, total_used = total_used + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(awardedPoints, awardedPoints, account.id);
    });

    transaction();

    return {
      success: true,
      transNo,
      orderId,
      orderNo: order.order_no,
      userId: order.user_id,
      businessLineId: order.business_line_id,
      payAmount: order.pay_amount,
      pointCoefficient,
      basePoints,
      awardedPoints,
      pointsBefore,
      pointsAfter,
      accountId: account.id,
      accountBalanceAfter: account.balance - awardedPoints
    };
  }

  static getUserPoints(userId) {
    const user = db.prepare(`
      SELECT u.id, u.username, u.nickname, u.total_points, u.available_points,
             ul.name as level_name, ul.code as level_code
      FROM users u
      LEFT JOIN user_levels ul ON u.current_level_id = ul.id
      WHERE u.id = ?
    `).get(userId);

    if (!user) {
      return null;
    }

    const totalTransactions = db.prepare(`
      SELECT COUNT(*) as count FROM point_transactions WHERE user_id = ?
    `).get(userId).count;

    const recentTransactions = db.prepare(`
      SELECT pt.*, bl.name as business_name
      FROM point_transactions pt
      LEFT JOIN business_lines bl ON pt.business_line_id = bl.id
      WHERE pt.user_id = ?
      ORDER BY pt.created_at DESC
      LIMIT 20
    `).all(userId);

    return {
      user,
      totalTransactions,
      recentTransactions
    };
  }

  static getBusinessAccount(businessLineId) {
    const account = db.prepare(`
      SELECT bpa.*, bl.name as business_name, bl.code as business_code
      FROM business_point_accounts bpa
      JOIN business_lines bl ON bpa.business_line_id = bl.id
      WHERE bpa.business_line_id = ?
    `).get(businessLineId);

    return account;
  }

  static getAllBusinessAccounts() {
    return db.prepare(`
      SELECT bpa.*, bl.name as business_name, bl.code as business_code
      FROM business_point_accounts bpa
      JOIN business_lines bl ON bpa.business_line_id = bl.id
      ORDER BY bl.id
    `).all();
  }

  static getOrderDetail(orderId) {
    const order = db.prepare(`
      SELECT o.*, bl.name as business_name, bl.code as business_code,
             ul.name as level_name_at_payment
      FROM orders o
      JOIN business_lines bl ON o.business_line_id = bl.id
      LEFT JOIN user_levels ul ON o.level_discount_amount > 0
      WHERE o.id = ?
    `).get(orderId);

    if (!order) return null;

    const pointTrans = db.prepare(`
      SELECT * FROM point_transactions WHERE order_id = ?
    `).get(orderId);

    const growthRecord = db.prepare(`
      SELECT * FROM growth_records WHERE order_id = ?
    `).get(orderId);

    return {
      order,
      pointTransaction: pointTrans || null,
      growthRecord: growthRecord || null
    };
  }

  static getUserOrders(userId, limit = 20) {
    const orders = db.prepare(`
      SELECT o.*, bl.name as business_name, bl.code as business_code
      FROM orders o
      JOIN business_lines bl ON o.business_line_id = bl.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      LIMIT ?
    `).all(userId, limit);

    return orders;
  }

  static cancelOrder(orderId, userId, reason = '用户主动取消') {
    const orderDetail = this.getOrderDetail(orderId);
    if (!orderDetail) {
      throw new Error('订单不存在');
    }

    const order = orderDetail.order;
    
    if (order.user_id !== userId) {
      throw new Error('无权取消该订单');
    }

    if (order.status === 'cancelled') {
      return { success: true, message: '订单已取消', order };
    }

    if (order.status !== 'paid') {
      throw new Error('只有已支付订单可以取消');
    }

    const orderProduct = InventoryService.getProductByOrderId(orderId);

    const transaction = db.transaction(() => {
      if (orderDetail.pointTransaction) {
        const pointTrans = orderDetail.pointTransaction;
        const pointsToRefund = pointTrans.points;

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        
        const currentPointsBefore = user.available_points;
        const currentPointsAfter = Math.max(0, currentPointsBefore - pointsToRefund);

        const refundTransNo = this.generateTransNo();
        db.prepare(`
          INSERT INTO point_transactions (
            trans_no, user_id, order_id, business_line_id, account_id,
            points, points_before, points_after, trans_type, trans_desc
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          refundTransNo, userId, orderId, order.business_line_id, pointTrans.account_id,
          -pointsToRefund, currentPointsBefore, currentPointsAfter, 'refund',
          `订单取消积分回滚，原流水号:${pointTrans.trans_no}，原因:${reason}`
        );

        db.prepare(`
          UPDATE users 
          SET available_points = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(currentPointsAfter, userId);

        db.prepare(`
          UPDATE business_point_accounts 
          SET balance = balance + ?, total_used = total_used - ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(pointsToRefund, pointsToRefund, pointTrans.account_id);
      }

      if (orderDetail.growthRecord) {
        const growthRecord = orderDetail.growthRecord;
        const growthToRefund = growthRecord.growth_amount;

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        const currentGrowthBefore = user.current_growth;
        const currentGrowthAfter = Math.max(0, currentGrowthBefore - growthToRefund);

        db.prepare(`
          INSERT INTO growth_records (
            user_id, order_id, business_line_id, growth_amount,
            growth_before, growth_after, business_coefficient,
            source_type, source_desc
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId, orderId, order.business_line_id, -growthToRefund,
          currentGrowthBefore, currentGrowthAfter, growthRecord.business_coefficient,
          'refund',
          `订单取消成长值回滚，原因:${reason}`
        );

        db.prepare(`
          UPDATE users 
          SET current_growth = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(currentGrowthAfter, userId);

        db.prepare(`
          UPDATE growth_expire_schedule 
          SET is_expired = 1, processed_at = CURRENT_TIMESTAMP
          WHERE growth_record_id = ?
        `).run(growthRecord.id);
      }

      if (orderProduct) {
        db.prepare(`
          UPDATE products 
          SET stock = MIN(stock + ?, max_stock), updated_at = CURRENT_TIMESTAMP
          WHERE product_code = ?
        `).run(orderProduct.quantity, orderProduct.product_code);

        db.prepare(`
          DELETE FROM order_product_links 
          WHERE order_id = ? AND product_code = ?
        `).run(orderId, orderProduct.product_code);
      }

      db.prepare(`
        UPDATE orders 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(orderId);
    });

    transaction();

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    
    return {
      success: true,
      message: '订单已取消',
      order: updatedOrder,
      refundDetails: {
        pointsRefunded: orderDetail.pointTransaction ? orderDetail.pointTransaction.points : 0,
        growthRefunded: orderDetail.growthRecord ? orderDetail.growthRecord.growth_amount : 0,
        stockRestored: orderProduct ? orderProduct.quantity : 0,
        productCode: orderProduct ? orderProduct.product_code : null,
        reason
      }
    };
  }

  static checkUserHasCancelPrivilege(userId) {
    const user = db.prepare(`
      SELECT u.*, p.code as privilege_code
      FROM users u
      JOIN level_privileges lp ON u.current_level_id = lp.level_id
      JOIN privileges p ON lp.privilege_id = p.id
      WHERE u.id = ? AND p.code = 'FREE_CANCEL' AND lp.is_visible = 1 AND p.status = 1
    `).get(userId);

    return {
      hasPrivilege: !!user,
      privilegeCode: 'FREE_CANCEL',
      privilegeName: '免费取消'
    };
  }
}

module.exports = PaymentCenterService;
