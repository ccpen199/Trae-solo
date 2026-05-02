const db = require('../config/database');
const auditService = require('./audit.service');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const ESCROW_STATUS = {
  NONE: 'none',
  LOCKED: 'locked',
  RELEASING: 'releasing',
  RELEASED: 'released',
  REFUNDING: 'refunding',
  REFUNDED: 'refunded'
};

const TRANSACTION_TYPES = {
  PAYMENT: 'payment',
  ESCROW_LOCK: 'escrow_lock',
  ESCROW_RELEASE: 'escrow_release',
  REFUND: 'refund',
  SERVICE_FEE: 'service_fee',
  WITHDRAWAL: 'withdrawal',
  DEPOSIT: 'deposit'
};

const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

class EscrowPayService {
  constructor() {
    this.feeRate = parseFloat(process.env.ESCROW_FEE_RATE) || 0.02;
    this.minFee = parseFloat(process.env.ESCROW_MIN_FEE) || 5;
  }

  generateTransactionNo() {
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp}${random}`;
  }

  calculateServiceFee(amount) {
    const fee = amount * this.feeRate;
    return Math.max(fee, this.minFee);
  }

  calculateTotalAmount(price) {
    const serviceFee = this.calculateServiceFee(price);
    return {
      price,
      serviceFee,
      total: price + serviceFee
    };
  }

  createTransaction(userId, type, amount, options = {}) {
    const { orderId = null, relatedTransactionNo = null, description = null } = options;
    
    const transactionNo = this.generateTransactionNo();
    
    const stmt = db.prepare(`
      INSERT INTO fund_transactions (
        transaction_no, order_id, user_id, type, amount,
        status, related_transaction_no, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      transactionNo,
      orderId,
      userId,
      type,
      amount,
      TRANSACTION_STATUS.PENDING,
      relatedTransactionNo,
      description
    );

    return {
      id: result.lastInsertRowid,
      transactionNo
    };
  }

  updateTransactionStatus(transactionId, status, errorMessage = null) {
    const stmt = db.prepare(`
      UPDATE fund_transactions 
      SET status = ?, completed_at = CURRENT_TIMESTAMP, error_message = ?
      WHERE id = ?
    `);
    stmt.run(status, errorMessage, transactionId);

    const transaction = db.prepare('SELECT * FROM fund_transactions WHERE id = ?').get(transactionId);

    auditService.logStatusChange({
      module: auditService.MODULES.PAYMENT,
      resourceType: 'fund_transaction',
      resourceId: transaction.transaction_no,
      oldValue: { status: transaction.status },
      newValue: { status },
      description: `资金交易状态变更: ${transaction.transaction_no}`
    });

    return transaction;
  }

  lockEscrow(orderId, actor = null) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    if (order.escrow_status === ESCROW_STATUS.LOCKED) {
      return { alreadyLocked: true, order };
    }

    const transaction = this.createTransaction(order.buyer_id, TRANSACTION_TYPES.ESCROW_LOCK, order.total_amount, {
      orderId,
      description: `订单 ${order.order_no} 担保资金锁定`
    });

    this.updateTransactionStatus(transaction.id, TRANSACTION_STATUS.COMPLETED);

    const updateOrder = db.prepare(`
      UPDATE orders 
      SET escrow_status = ?, escrow_locked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateOrder.run(ESCROW_STATUS.LOCKED, orderId);

    auditService.logStatusChange({
      user: actor,
      module: auditService.MODULES.PAYMENT,
      resourceType: 'order',
      resourceId: order.id,
      oldValue: { escrow_status: order.escrow_status },
      newValue: { escrow_status: ESCROW_STATUS.LOCKED },
      description: `订单 ${order.order_no} 担保资金已锁定，金额: ${order.total_amount}`
    });

    return {
      orderId,
      orderNo: order.order_no,
      escrowStatus: ESCROW_STATUS.LOCKED,
      amount: order.total_amount,
      transactionNo: transaction.transactionNo
    };
  }

  releaseEscrow(orderId, actor = null) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    if (order.escrow_status !== ESCROW_STATUS.LOCKED) {
      throw new Error(`担保资金状态不正确: ${order.escrow_status}`);
    }

    const updateOrder = db.prepare(`
      UPDATE orders 
      SET escrow_status = ?, escrow_released_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateOrder.run(ESCROW_STATUS.RELEASING, orderId);

    const sellerTransaction = this.createTransaction(order.seller_id, TRANSACTION_TYPES.ESCROW_RELEASE, order.price, {
      orderId,
      description: `订单 ${order.order_no} 货款释放给卖家`
    });
    this.updateTransactionStatus(sellerTransaction.id, TRANSACTION_STATUS.COMPLETED);

    if (order.service_fee > 0) {
      const feeTransaction = this.createTransaction(order.seller_id, TRANSACTION_TYPES.SERVICE_FEE, -order.service_fee, {
        orderId,
        relatedTransactionNo: sellerTransaction.transactionNo,
        description: `订单 ${order.order_no} 平台服务费扣除`
      });
      this.updateTransactionStatus(feeTransaction.id, TRANSACTION_STATUS.COMPLETED);
    }

    const finalUpdate = db.prepare(`
      UPDATE orders 
      SET escrow_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    finalUpdate.run(ESCROW_STATUS.RELEASED, orderId);

    auditService.logStatusChange({
      user: actor,
      module: auditService.MODULES.PAYMENT,
      resourceType: 'order',
      resourceId: order.id,
      oldValue: { escrow_status: ESCROW_STATUS.LOCKED },
      newValue: { escrow_status: ESCROW_STATUS.RELEASED },
      description: `订单 ${order.order_no} 担保资金已释放，货款: ${order.price}, 服务费: ${order.service_fee}`
    });

    return {
      orderId,
      orderNo: order.order_no,
      escrowStatus: ESCROW_STATUS.RELEASED,
      sellerAmount: order.price,
      serviceFee: order.service_fee,
      transactionNo: sellerTransaction.transactionNo
    };
  }

  refundEscrow(orderId, refundAmount = null, actor = null) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    if (order.escrow_status !== ESCROW_STATUS.LOCKED) {
      throw new Error(`担保资金状态不正确: ${order.escrow_status}`);
    }

    const amount = refundAmount || order.total_amount;

    const updateOrder = db.prepare(`
      UPDATE orders 
      SET escrow_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateOrder.run(ESCROW_STATUS.REFUNDING, orderId);

    const transaction = this.createTransaction(order.buyer_id, TRANSACTION_TYPES.REFUND, amount, {
      orderId,
      description: `订单 ${order.order_no} 退款`
    });
    this.updateTransactionStatus(transaction.id, TRANSACTION_STATUS.COMPLETED);

    const finalUpdate = db.prepare(`
      UPDATE orders 
      SET escrow_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    finalUpdate.run(ESCROW_STATUS.REFUNDED, orderId);

    auditService.logStatusChange({
      user: actor,
      module: auditService.MODULES.PAYMENT,
      resourceType: 'order',
      resourceId: order.id,
      oldValue: { escrow_status: ESCROW_STATUS.LOCKED },
      newValue: { escrow_status: ESCROW_STATUS.REFUNDED },
      description: `订单 ${order.order_no} 退款完成，金额: ${amount}`
    });

    return {
      orderId,
      orderNo: order.order_no,
      escrowStatus: ESCROW_STATUS.REFUNDED,
      refundAmount: amount,
      transactionNo: transaction.transactionNo
    };
  }

  partialRefund(orderId, partialAmount, actor = null) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    if (order.escrow_status !== ESCROW_STATUS.LOCKED) {
      throw new Error(`担保资金状态不正确: ${order.escrow_status}`);
    }

    if (partialAmount >= order.total_amount) {
      throw new Error('部分退款金额不能等于或大于订单总额');
    }

    const refundTransaction = this.createTransaction(order.buyer_id, TRANSACTION_TYPES.REFUND, partialAmount, {
      orderId,
      description: `订单 ${order.order_no} 部分退款`
    });
    this.updateTransactionStatus(refundTransaction.id, TRANSACTION_STATUS.COMPLETED);

    const remainingAmount = order.price - partialAmount;
    if (remainingAmount > 0) {
      const sellerTransaction = this.createTransaction(order.seller_id, TRANSACTION_TYPES.ESCROW_RELEASE, remainingAmount, {
        orderId,
        description: `订单 ${order.order_no} 剩余货款释放给卖家`
      });
      this.updateTransactionStatus(sellerTransaction.id, TRANSACTION_STATUS.COMPLETED);
    }

    const updateOrder = db.prepare(`
      UPDATE orders 
      SET escrow_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateOrder.run(ESCROW_STATUS.REFUNDED, orderId);

    auditService.logStatusChange({
      user: actor,
      module: auditService.MODULES.PAYMENT,
      resourceType: 'order',
      resourceId: order.id,
      oldValue: { escrow_status: ESCROW_STATUS.LOCKED },
      newValue: { escrow_status: ESCROW_STATUS.REFUNDED },
      description: `订单 ${order.order_no} 部分退款完成，退款金额: ${partialAmount}, 剩余货款: ${remainingAmount}`
    });

    return {
      orderId,
      orderNo: order.order_no,
      escrowStatus: ESCROW_STATUS.REFUNDED,
      refundAmount: partialAmount,
      sellerAmount: remainingAmount
    };
  }

  getTransactionByNo(transactionNo) {
    return db.prepare('SELECT * FROM fund_transactions WHERE transaction_no = ?').get(transactionNo);
  }

  getTransactionsByOrder(orderId) {
    return db.prepare(`
      SELECT * FROM fund_transactions 
      WHERE order_id = ? 
      ORDER BY created_at ASC
    `).all(orderId);
  }

  getTransactionsByUser(userId, options = {}) {
    const { limit = 50, offset = 0, type = null } = options;
    
    let sql = `SELECT * FROM fund_transactions WHERE user_id = ?`;
    const params = [userId];

    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  }

  getEscrowStatus(orderId) {
    const order = db.prepare('SELECT id, order_no, escrow_status, escrow_locked_at, escrow_released_at, price, service_fee, total_amount FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      return null;
    }

    const transactions = this.getTransactionsByOrder(orderId);

    return {
      order,
      transactions,
      statusInfo: this.getEscrowStatusInfo(order.escrow_status)
    };
  }

  getEscrowStatusInfo(status) {
    const statusMap = {
      [ESCROW_STATUS.NONE]: { label: '无担保', description: '该订单未涉及担保交易' },
      [ESCROW_STATUS.LOCKED]: { label: '资金已锁定', description: '买家已支付，资金由平台托管' },
      [ESCROW_STATUS.RELEASING]: { label: '释放中', description: '资金正在释放给卖家' },
      [ESCROW_STATUS.RELEASED]: { label: '已释放', description: '货款已释放给卖家' },
      [ESCROW_STATUS.REFUNDING]: { label: '退款中', description: '正在处理退款' },
      [ESCROW_STATUS.REFUNDED]: { label: '已退款', description: '资金已退回给买家' }
    };

    return statusMap[status] || { label: status, description: '未知状态' };
  }
}

module.exports = new EscrowPayService();
module.exports.ESCROW_STATUS = ESCROW_STATUS;
module.exports.TRANSACTION_TYPES = TRANSACTION_TYPES;
module.exports.TRANSACTION_STATUS = TRANSACTION_STATUS;
