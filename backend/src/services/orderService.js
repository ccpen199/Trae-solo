const { get, all, run } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const ORDER_STATUSES = {
  PENDING_UPLOAD: 'pending_upload',
  PENDING_EDIT: 'pending_edit',
  PENDING_TEMPLATE: 'pending_template',
  PENDING_EXPORT: 'pending_export',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
};

const STATUS_NAMES = {
  [ORDER_STATUSES.PENDING_UPLOAD]: '待上传图片',
  [ORDER_STATUSES.PENDING_EDIT]: '待编辑',
  [ORDER_STATUSES.PENDING_TEMPLATE]: '待套模板',
  [ORDER_STATUSES.PENDING_EXPORT]: '待导出',
  [ORDER_STATUSES.PUBLISHED]: '已发布',
  [ORDER_STATUSES.CANCELLED]: '已取消',
  [ORDER_STATUSES.REJECTED]: '已驳回'
};

class OrderService {
  static generateOrderNo() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `IMG${year}${month}${day}${random}`;
  }

  static createOrder(orderData, creatorId) {
    return new Promise((resolve, reject) => {
      try {
        const orderNo = this.generateOrderNo();
        
        const result = run(
          `INSERT INTO orders 
           (order_no, status, canvas_name, canvas_width, canvas_height, canvas_background, 
            creator_id, assignee_id, expected_completion_time, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            orderNo,
            ORDER_STATUSES.PENDING_UPLOAD,
            orderData.canvasName,
            orderData.canvasWidth || 800,
            orderData.canvasHeight || 800,
            orderData.canvasBackground || '#ffffff',
            creatorId,
            orderData.assigneeId,
            orderData.expectedCompletionTime
          ]
        );
        
        const orderId = result.lastInsertRowid;
        
        run(
          `INSERT INTO operation_logs 
           (order_id, user_id, action, action_detail, from_status, to_status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [orderId, creatorId, 'create_order', `创建订单: ${orderNo}`, null, ORDER_STATUSES.PENDING_UPLOAD]
        );
        
        run(
          `INSERT INTO timeline 
           (order_id, user_id, action, comment, created_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [orderId, creatorId, '订单创建', `订单号: ${orderNo}`]
        );
        
        if (orderData.assigneeId) {
          run(
            `INSERT INTO messages 
             (user_id, order_id, title, content, message_type, created_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [orderData.assigneeId, orderId, '新订单分配', `您有新的图片编辑订单: ${orderNo}`, 'assignment']
          );
        }
        
        resolve({
          id: orderId,
          orderNo,
          status: ORDER_STATUSES.PENDING_UPLOAD,
          statusName: STATUS_NAMES[ORDER_STATUSES.PENDING_UPLOAD]
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static getOrderById(orderId) {
    return new Promise((resolve, reject) => {
      try {
        const order = get(
          `SELECT o.*, 
                  u1.nickname as creator_name,
                  u2.nickname as assignee_name
           FROM orders o
           LEFT JOIN users u1 ON o.creator_id = u1.id
           LEFT JOIN users u2 ON o.assignee_id = u2.id
           WHERE o.id = ?`,
          [orderId]
        );
        
        if (!order) {
          resolve(null);
          return;
        }
        
        resolve({
          ...order,
          statusName: STATUS_NAMES[order.status]
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static getOrdersByUser(userId, role, filters = {}) {
    return new Promise((resolve, reject) => {
      try {
        let query = `
          SELECT o.*, 
                 u1.nickname as creator_name,
                 u2.nickname as assignee_name
          FROM orders o
          LEFT JOIN users u1 ON o.creator_id = u1.id
          LEFT JOIN users u2 ON o.assignee_id = u2.id
          WHERE 1=1
        `;
        let params = [];
        
        if (role !== 'admin') {
          if (role === 'design_operation') {
            query += ' AND (o.creator_id = ? OR o.assignee_id = ?)';
            params.push(userId, userId);
          } else if (role === 'creator') {
            query += ' AND o.assignee_id = ?';
            params.push(userId);
          } else if (role === 'merchant') {
            query += ' AND o.creator_id = ?';
            params.push(userId);
          } else if (role === 'auditor') {
            query += ' AND o.status IN (?, ?, ?)';
            params.push(ORDER_STATUSES.PENDING_TEMPLATE, ORDER_STATUSES.PENDING_EXPORT, ORDER_STATUSES.PUBLISHED);
          }
        }
        
        if (filters.status) {
          query += ' AND o.status = ?';
          params.push(filters.status);
        }
        
        query += ' ORDER BY o.created_at DESC';
        
        const orders = all(query, params);
        resolve(orders.map(o => ({
          ...o,
          statusName: STATUS_NAMES[o.status]
        })));
      } catch (err) {
        reject(err);
      }
    });
  }

  static updateOrderStatus(orderId, newStatus, operatorId, actionDetail = '') {
    return new Promise((resolve, reject) => {
      try {
        const order = get('SELECT * FROM orders WHERE id = ?', [orderId]);
        
        if (!order) {
          reject(new Error('订单不存在'));
          return;
        }
        
        const validTransitions = this.getValidStatusTransitions(order.status);
        if (!validTransitions.includes(newStatus)) {
          reject(new Error(`无法从状态 ${order.status} 转换到 ${newStatus}`));
          return;
        }
        
        run(
          `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [newStatus, orderId]
        );
        
        run(
          `INSERT INTO operation_logs 
           (order_id, user_id, action, action_detail, from_status, to_status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [orderId, operatorId, 'status_change', actionDetail || `状态变更`, order.status, newStatus]
        );
        
        resolve({
          orderId,
          fromStatus: order.status,
          toStatus: newStatus,
          fromStatusName: STATUS_NAMES[order.status],
          toStatusName: STATUS_NAMES[newStatus]
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static getValidStatusTransitions(currentStatus) {
    const transitions = {
      [ORDER_STATUSES.PENDING_UPLOAD]: [ORDER_STATUSES.PENDING_EDIT, ORDER_STATUSES.CANCELLED],
      [ORDER_STATUSES.PENDING_EDIT]: [ORDER_STATUSES.PENDING_TEMPLATE, ORDER_STATUSES.CANCELLED, ORDER_STATUSES.REJECTED],
      [ORDER_STATUSES.PENDING_TEMPLATE]: [ORDER_STATUSES.PENDING_EXPORT, ORDER_STATUSES.CANCELLED, ORDER_STATUSES.REJECTED, ORDER_STATUSES.PENDING_EDIT],
      [ORDER_STATUSES.PENDING_EXPORT]: [ORDER_STATUSES.PUBLISHED, ORDER_STATUSES.CANCELLED, ORDER_STATUSES.REJECTED, ORDER_STATUSES.PENDING_TEMPLATE],
      [ORDER_STATUSES.PUBLISHED]: [],
      [ORDER_STATUSES.CANCELLED]: [],
      [ORDER_STATUSES.REJECTED]: [ORDER_STATUSES.PENDING_EDIT, ORDER_STATUSES.CANCELLED]
    };
    return transitions[currentStatus] || [];
  }

  static getTodoCount(userId, role) {
    return new Promise((resolve, reject) => {
      try {
        let query = '';
        let params = [];
        
        if (role === 'admin') {
          query = `
            SELECT status, COUNT(*) as count 
            FROM orders 
            WHERE status NOT IN (?, ?)
            GROUP BY status
          `;
          params = [ORDER_STATUSES.PUBLISHED, ORDER_STATUSES.CANCELLED];
        } else if (role === 'design_operation') {
          query = `
            SELECT status, COUNT(*) as count 
            FROM orders 
            WHERE (creator_id = ? OR assignee_id = ?)
              AND status NOT IN (?, ?)
            GROUP BY status
          `;
          params = [userId, userId, ORDER_STATUSES.PUBLISHED, ORDER_STATUSES.CANCELLED];
        } else if (role === 'creator') {
          query = `
            SELECT status, COUNT(*) as count 
            FROM orders 
            WHERE assignee_id = ?
              AND status IN (?, ?)
            GROUP BY status
          `;
          params = [userId, ORDER_STATUSES.PENDING_EDIT, ORDER_STATUSES.PENDING_EXPORT];
        } else if (role === 'merchant') {
          query = `
            SELECT status, COUNT(*) as count 
            FROM orders 
            WHERE creator_id = ?
              AND status NOT IN (?, ?)
            GROUP BY status
          `;
          params = [userId, ORDER_STATUSES.PUBLISHED, ORDER_STATUSES.CANCELLED];
        } else if (role === 'auditor') {
          query = `
            SELECT status, COUNT(*) as count 
            FROM orders 
            WHERE status = ?
            GROUP BY status
          `;
          params = [ORDER_STATUSES.PENDING_TEMPLATE];
        } else {
          resolve({});
          return;
        }
        
        const results = all(query, params);
        
        const todoCounts = {};
        let total = 0;
        
        results.forEach(r => {
          todoCounts[r.status] = r.count;
          todoCounts[STATUS_NAMES[r.status] + '_count'] = r.count;
          total += r.count;
        });
        
        todoCounts.total = total;
        resolve(todoCounts);
      } catch (err) {
        reject(err);
      }
    });
  }

  static getStatusInfo() {
    return Object.keys(STATUS_NAMES).map(key => ({
      code: key,
      name: STATUS_NAMES[key]
    }));
  }
}

module.exports = { OrderService, ORDER_STATUSES, STATUS_NAMES };
