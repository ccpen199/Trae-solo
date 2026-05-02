const { get, all, run } = require('../config/database');

const REVERSE_TYPES = {
  CANCEL: 'cancel',
  REFUND: 'refund',
  RETURN: 'return',
  COMPLAINT: 'complaint',
  REWORK: 'rework'
};

const REVERSE_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CLOSED: 'closed'
};

class ReverseOrderEngine {
  static createReverseOrder(originalOrderId, reverseType, reason, initiatorId) {
    return new Promise((resolve, reject) => {
      try {
        const order = get(
          'SELECT * FROM orders WHERE id = ?',
          [originalOrderId]
        );
        
        if (!order) {
          reject(new Error('原始订单不存在'));
          return;
        }

        const result = run(
          `INSERT INTO reverse_orders 
           (original_order_id, reverse_type, reverse_reason, status, initiator_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [originalOrderId, reverseType, reason, REVERSE_STATUSES.PENDING, initiatorId]
        );
        
        const reverseOrderId = result.lastInsertRowid;
        
        run(
          `INSERT INTO operation_logs 
           (order_id, user_id, action, action_detail, from_status, to_status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [originalOrderId, initiatorId, 'create_reverse', 
           `创建逆向单: ${reverseType}, 原因: ${reason}`, 
           order.status, order.status]
        );
        
        run(
          `INSERT INTO timeline 
           (order_id, user_id, action, comment, created_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [originalOrderId, initiatorId, '逆向单创建', 
           `类型: ${reverseType}, 原因: ${reason}`]
        );
        
        resolve({
          id: reverseOrderId,
          originalOrderId,
          reverseType,
          reason,
          status: REVERSE_STATUSES.PENDING,
          initiatorId
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static getReverseOrders(originalOrderId) {
    return new Promise((resolve, reject) => {
      try {
        const reverseOrders = all(
          `SELECT ro.*, 
                  u.nickname as initiator_name,
                  o.order_no as original_order_no,
                  o.status as original_order_status
           FROM reverse_orders ro
           LEFT JOIN users u ON ro.initiator_id = u.id
           LEFT JOIN orders o ON ro.original_order_id = o.id
           WHERE ro.original_order_id = ?
           ORDER BY ro.created_at DESC`,
          [originalOrderId]
        );
        resolve(reverseOrders);
      } catch (err) {
        reject(err);
      }
    });
  }

  static updateReverseStatus(reverseOrderId, newStatus, operatorId, comment = '') {
    return new Promise((resolve, reject) => {
      try {
        const reverseOrder = get(
          'SELECT * FROM reverse_orders WHERE id = ?',
          [reverseOrderId]
        );
        
        if (!reverseOrder) {
          reject(new Error('逆向单不存在'));
          return;
        }

        const validTransitions = this.getValidStatusTransitions(reverseOrder.status);
        if (!validTransitions.includes(newStatus)) {
          reject(new Error(`无法从状态 ${reverseOrder.status} 转换到 ${newStatus}`));
          return;
        }

        run(
          `UPDATE reverse_orders 
           SET status = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [newStatus, reverseOrderId]
        );

        run(
          `INSERT INTO operation_logs 
           (order_id, user_id, action, action_detail, from_status, to_status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [reverseOrder.original_order_id, operatorId, 'update_reverse', 
           `逆向单状态变更: ${reverseOrder.status} -> ${newStatus}`, 
           reverseOrder.status, newStatus]
        );

        if (comment) {
          run(
            `INSERT INTO timeline 
             (order_id, user_id, action, comment, created_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [reverseOrder.original_order_id, operatorId, '逆向单处理', comment]
          );
        }

        resolve({
          id: reverseOrderId,
          originalOrderId: reverseOrder.original_order_id,
          fromStatus: reverseOrder.status,
          toStatus: newStatus
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static getValidStatusTransitions(currentStatus) {
    const transitions = {
      [REVERSE_STATUSES.PENDING]: [REVERSE_STATUSES.PROCESSING, REVERSE_STATUSES.REJECTED, REVERSE_STATUSES.CLOSED],
      [REVERSE_STATUSES.PROCESSING]: [REVERSE_STATUSES.APPROVED, REVERSE_STATUSES.REJECTED, REVERSE_STATUSES.CLOSED],
      [REVERSE_STATUSES.APPROVED]: [REVERSE_STATUSES.COMPLETED, REVERSE_STATUSES.CLOSED],
      [REVERSE_STATUSES.REJECTED]: [REVERSE_STATUSES.CLOSED],
      [REVERSE_STATUSES.COMPLETED]: [],
      [REVERSE_STATUSES.CLOSED]: []
    };
    return transitions[currentStatus] || [];
  }

  static validateWithMainLedger(originalOrderId) {
    return new Promise((resolve, reject) => {
      try {
        const order = get(
          `SELECT o.*, 
                  (SELECT COUNT(*) FROM reverse_orders WHERE original_order_id = o.id AND status IN (?, ?, ?)) as active_reverse_count
           FROM orders o
           WHERE o.id = ?`,
          [REVERSE_STATUSES.PENDING, REVERSE_STATUSES.PROCESSING, REVERSE_STATUSES.APPROVED, originalOrderId]
        );
        
        if (!order) {
          reject(new Error('订单不存在'));
          return;
        }

        resolve({
          orderId: order.id,
          orderNo: order.order_no,
          currentStatus: order.status,
          hasActiveReverse: order.active_reverse_count > 0,
          activeReverseCount: order.active_reverse_count
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static getReverseTypeInfo() {
    return [
      { code: REVERSE_TYPES.CANCEL, name: '取消订单', description: '取消未完成的订单' },
      { code: REVERSE_TYPES.REFUND, name: '退款', description: '申请退款' },
      { code: REVERSE_TYPES.RETURN, name: '退货', description: '申请退货退款' },
      { code: REVERSE_TYPES.COMPLAINT, name: '投诉', description: '提交投诉' },
      { code: REVERSE_TYPES.REWORK, name: '返工', description: '申请重新制作' }
    ];
  }
}

module.exports = { ReverseOrderEngine, REVERSE_TYPES, REVERSE_STATUSES };
