const db = require('../database');
const { generateOrderNo, generateId } = require('../utils/orderGenerator');
const { logAuditEvent, AUDIT_EVENT_TYPES } = require('./auditService');
const { ORDER_STATUSES, updateOrderStatus } = require('./orderStatusService');

const REVERSE_REASONS = {
  STOCK_SHORTAGE: 'stock_shortage',
  PAYMENT_FAILED: 'payment_failed',
  SHIPPING_FAILED: 'shipping_failed',
  AFTER_SALE_RETURN: 'after_sale_return',
  AFTER_SALE_EXCHANGE: 'after_sale_exchange',
  QUALITY_ISSUE: 'quality_issue'
};

const createReverseOrder = (originalOrderId, reverseData, operatorInfo = {}) => {
  const { reason, comment = null, reverseType = 'return' } = reverseData;

  const originalOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(originalOrderId);
  
  if (!originalOrder) {
    return { success: false, message: '原订单不存在' };
  }

  const validStatuses = [ORDER_STATUSES.ORDER_PLACED, ORDER_STATUSES.PAID, ORDER_STATUSES.SHIPPED, ORDER_STATUSES.COMPLETED];
  if (!validStatuses.includes(originalOrder.status)) {
    return { success: false, message: `订单状态 ${originalOrder.status} 不允许逆向处理` };
  }

  const existingReverse = db.prepare(`
    SELECT id FROM orders 
    WHERE original_order_id = ? AND is_reverse = 1 AND status NOT IN (?, ?)
  `).get(originalOrderId, ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED);

  if (existingReverse) {
    return { success: false, message: '已存在进行中的逆向订单' };
  }

  const transaction = db.transaction(() => {
    const reverseOrderNo = generateOrderNo();
    const reverseOrderId = generateId('rev_order');

    const reverseStmt = db.prepare(`
      INSERT INTO orders (
        id, order_no, consumer_id, consumer_name, status,
        total_amount, store_id, brand_id, member_level,
        is_reverse, original_order_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    reverseStmt.run(
      reverseOrderId,
      reverseOrderNo,
      originalOrder.consumer_id,
      originalOrder.consumer_name,
      ORDER_STATUSES.REVERSED,
      originalOrder.total_amount,
      originalOrder.store_id,
      originalOrder.brand_id,
      originalOrder.member_level,
      originalOrderId
    );

    const originalDetails = db.prepare('SELECT * FROM order_details WHERE order_id = ?').all(originalOrderId);
    for (const detail of originalDetails) {
      const reverseDetailId = generateId('rev_detail');
      db.prepare(`
        INSERT INTO order_details (
          id, order_id, product_id, product_name, sku,
          quantity, unit_price, subtotal, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'reverse')
      `).run(
        reverseDetailId,
        reverseOrderId,
        detail.product_id,
        detail.product_name,
        detail.sku,
        detail.quantity,
        detail.unit_price,
        detail.subtotal
      );

      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(detail.quantity, detail.product_id);
    }

    logAuditEvent(AUDIT_EVENT_TYPES.ORDER_REVERSED, {
      orderId: reverseOrderId,
      ...operatorInfo,
      detail: { 
        originalOrderId,
        originalOrderNo: originalOrder.order_no,
        reason,
        reverseType,
        comment
      }
    });

    const reverseOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(reverseOrderId);
    const reverseDetails = db.prepare('SELECT * FROM order_details WHERE order_id = ?').all(reverseOrderId);

    return { 
      success: true, 
      order: { ...reverseOrder, details: reverseDetails } 
    };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('创建逆向订单失败:', error);
    return { success: false, message: error.message };
  }
};

const getReverseOrders = (originalOrderId) => {
  return db.prepare(`
    SELECT o.*, od.id as detail_id, od.product_name, od.quantity, od.unit_price
    FROM orders o
    LEFT JOIN order_details od ON o.id = od.order_id
    WHERE o.original_order_id = ? AND o.is_reverse = 1
    ORDER BY o.created_at DESC
  `).all(originalOrderId);
};

module.exports = {
  REVERSE_REASONS,
  createReverseOrder,
  getReverseOrders
};
