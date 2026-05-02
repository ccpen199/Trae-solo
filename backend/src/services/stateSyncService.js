const { v4: uuidv4 } = require('uuid');
const db = require('../database/init');

const StateSyncService = {
  createStatusFlow(orderId, fromStatus, toStatus, operatorId = null, operatorRole = null, reason = null) {
    const flowId = uuidv4();
    db.prepare(`
      INSERT INTO status_flow (id, order_id, from_status, to_status, operator_id, operator_role, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(flowId, orderId, fromStatus, toStatus, operatorId, operatorRole, reason);

    return flowId;
  },

  createNotification(userId, userRole, orderId, title, content, type) {
    const notificationId = uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, user_id, user_role, order_id, title, content, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(notificationId, userId, userRole, orderId, title, content, type);

    return notificationId;
  },

  createTodo(userId, userRole, orderId, taskType, priority = 'medium', dueAt = null) {
    const todoId = uuidv4();
    db.prepare(`
      INSERT INTO todos (id, user_id, user_role, order_id, task_type, priority, due_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(todoId, userId, userRole, orderId, taskType, priority, dueAt);

    return todoId;
  },

  completeTodo(todoId) {
    db.prepare(`
      UPDATE todos 
      SET status = 'completed', updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(todoId);
  },

  cancelTodo(todoId) {
    db.prepare(`
      UPDATE todos 
      SET status = 'cancelled', updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(todoId);
  },

  createAuditLog(userId, userRole, action, targetType, targetId, oldValue = null, newValue = null, ipAddress = null, userAgent = null) {
    const logId = uuidv4();
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_role, action, target_type, target_id, old_value, new_value, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(logId, userId, userRole, action, targetType, targetId, 
           oldValue ? JSON.stringify(oldValue) : null, 
           newValue ? JSON.stringify(newValue) : null, 
           ipAddress, userAgent);

    return logId;
  },

  createOrderDetail(orderId, detailType, detailContent) {
    const detailId = uuidv4();
    db.prepare(`
      INSERT INTO order_detail (id, order_id, detail_type, detail_content)
      VALUES (?, ?, ?, ?)
    `).run(detailId, orderId, detailType, JSON.stringify(detailContent));

    return detailId;
  },

  syncStateOnStatusChange(order, newStatus, operatorId, operatorRole, reason = null) {
    const oldStatus = order.status;

    if (oldStatus === newStatus) {
      return;
    }

    this.createStatusFlow(order.id, oldStatus, newStatus, operatorId, operatorRole, reason);

    this.handleNotifications(order, oldStatus, newStatus, operatorRole);
    this.handleTodos(order, oldStatus, newStatus);
    this.createOrderDetail(order.id, 'status_change', {
      from: oldStatus,
      to: newStatus,
      operatorId,
      operatorRole,
      reason,
      timestamp: Date.now()
    });
  },

  handleNotifications(order, oldStatus, newStatus, operatorRole) {
    const orderLink = `#/order/${order.id}`;

    switch (newStatus) {
      case 'driver_assigned':
        if (order.driver_id) {
          const driver = db.prepare(`
            SELECT u.*, d.id as driver_id
            FROM users u
            JOIN drivers d ON u.id = d.user_id
            WHERE d.id = ?
          `).get(order.driver_id);
          if (driver) {
            this.createNotification(
              driver.id, 'driver', order.id,
              '您有新的派单',
              `您已被分配新订单 ${order.order_no}，请尽快确认接单`,
              'new_order'
            );
          }
        }

        const passenger = db.prepare(`
          SELECT u.*, p.id as passenger_id
          FROM users u
          JOIN passengers p ON u.id = p.user_id
          WHERE p.id = ?
        `).get(order.passenger_id);
        if (passenger) {
          this.createNotification(
            passenger.id, 'passenger', order.id,
            '司机已接单',
            `您的订单 ${order.order_no} 已有司机接单`,
            'driver_assigned'
          );
        }
        break;

      case 'driver_accepted':
        if (order.passenger_id) {
          const p = db.prepare(`
            SELECT u.*, p.id as passenger_id
            FROM users u
            JOIN passengers p ON u.id = p.user_id
            WHERE p.id = ?
          `).get(order.passenger_id);
          if (p) {
            this.createNotification(
              p.id, 'passenger', order.id,
              '司机已确认接单',
              `司机已确认接单，正在赶来接您`,
              'driver_accepted'
            );
          }
        }
        break;

      case 'in_progress':
        if (order.passenger_id) {
          const p = db.prepare(`
            SELECT u.*, p.id as passenger_id
            FROM users u
            JOIN passengers p ON u.id = p.user_id
            WHERE p.id = ?
          `).get(order.passenger_id);
          if (p) {
            this.createNotification(
              p.id, 'passenger', order.id,
              '行程已开始',
              `您的行程已开始，祝您旅途愉快`,
              'ride_started'
            );
          }
        }
        break;

      case 'arrived':
        if (order.passenger_id) {
          const p = db.prepare(`
            SELECT u.*, p.id as passenger_id
            FROM users u
            JOIN passengers p ON u.id = p.user_id
            WHERE p.id = ?
          `).get(order.passenger_id);
          if (p) {
            this.createNotification(
              p.id, 'passenger', order.id,
              '已到达目的地',
              `您已到达目的地，请确认并支付`,
              'arrived'
            );
          }
        }
        break;

      case 'payment_completed':
        if (order.driver_id) {
          const d = db.prepare(`
            SELECT u.*, d.id as driver_id
            FROM users u
            JOIN drivers d ON u.id = d.user_id
            WHERE d.id = ?
          `).get(order.driver_id);
          if (d) {
            this.createNotification(
              d.id, 'driver', order.id,
              '订单已支付',
              `订单 ${order.order_no} 已支付，金额 ${order.actual_price} 元`,
              'payment_received'
            );
          }
        }
        break;

      case 'completed':
        if (order.passenger_id) {
          const p = db.prepare(`
            SELECT u.*, p.id as passenger_id
            FROM users u
            JOIN passengers p ON u.id = p.user_id
            WHERE p.id = ?
          `).get(order.passenger_id);
          if (p) {
            this.createNotification(
              p.id, 'passenger', order.id,
              '订单已完成',
              `您的订单 ${order.order_no} 已完成，请对服务进行评价`,
              'order_completed'
            );
          }
        }
        break;

      case 'cancelled':
        if (order.driver_id) {
          const d = db.prepare(`
            SELECT u.*, d.id as driver_id
            FROM users u
            JOIN drivers d ON u.id = d.user_id
            WHERE d.id = ?
          `).get(order.driver_id);
          if (d) {
            this.createNotification(
              d.id, 'driver', order.id,
              '订单已取消',
              `订单 ${order.order_no} 已被取消`,
              'order_cancelled'
            );
          }
        }
        if (order.passenger_id) {
          const p = db.prepare(`
            SELECT u.*, p.id as passenger_id
            FROM users u
            JOIN passengers p ON u.id = p.user_id
            WHERE p.id = ?
          `).get(order.passenger_id);
          if (p) {
            this.createNotification(
              p.id, 'passenger', order.id,
              '订单已取消',
              `您的订单 ${order.order_no} 已取消`,
              'order_cancelled'
            );
          }
        }
        break;
    }

    if (['cancelled', 'payment_completed', 'completed'].includes(newStatus)) {
      const dispatchers = db.prepare(`
        SELECT * FROM users WHERE role = 'dispatcher'
      `).all();
      dispatchers.forEach(d => {
        this.createNotification(
          d.id, 'dispatcher', order.id,
          '订单状态变更',
          `订单 ${order.order_no} 状态已变更为: ${this.getStatusName(newStatus)}`,
          'status_change'
        );
      });
    }
  },

  handleTodos(order, oldStatus, newStatus) {
    const pendingTodos = db.prepare(`
      SELECT * FROM todos 
      WHERE order_id = ? AND status = 'pending'
    `).all(order.id);

    pendingTodos.forEach(todo => {
      this.cancelTodo(todo.id);
    });

    switch (newStatus) {
      case 'pending':
        const dispatchers = db.prepare(`
          SELECT * FROM users WHERE role = 'dispatcher'
        `).all();
        dispatchers.forEach(d => {
          this.createTodo(
            d.id, 'dispatcher', order.id,
            'assign_driver', 'high'
          );
        });
        break;

      case 'driver_assigned':
        if (order.driver_id) {
          const driverUser = db.prepare(`
            SELECT u.*
            FROM users u
            JOIN drivers d ON u.id = d.user_id
            WHERE d.id = ?
          `).get(order.driver_id);
          if (driverUser) {
            this.createTodo(
              driverUser.id, 'driver', order.id,
              'accept_order', 'high'
            );
          }
        }
        break;

      case 'driver_accepted':
        if (order.driver_id) {
          const driverUser = db.prepare(`
            SELECT u.*
            FROM users u
            JOIN drivers d ON u.id = d.user_id
            WHERE d.id = ?
          `).get(order.driver_id);
          if (driverUser) {
            this.createTodo(
              driverUser.id, 'driver', order.id,
              'start_ride', 'high'
            );
          }
        }
        break;

      case 'in_progress':
        if (order.driver_id) {
          const driverUser = db.prepare(`
            SELECT u.*
            FROM users u
            JOIN drivers d ON u.id = d.user_id
            WHERE d.id = ?
          `).get(order.driver_id);
          if (driverUser) {
            this.createTodo(
              driverUser.id, 'driver', order.id,
              'confirm_arrival', 'medium'
            );
          }
        }
        break;

      case 'arrived':
        if (order.passenger_id) {
          const passengerUser = db.prepare(`
            SELECT u.*
            FROM users u
            JOIN passengers p ON u.id = p.user_id
            WHERE p.id = ?
          `).get(order.passenger_id);
          if (passengerUser) {
            this.createTodo(
              passengerUser.id, 'passenger', order.id,
              'complete_payment', 'high'
            );
          }
        }
        break;

      case 'payment_completed':
        if (order.passenger_id) {
          const passengerUser = db.prepare(`
            SELECT u.*
            FROM users u
            JOIN passengers p ON u.id = p.user_id
            WHERE p.id = ?
          `).get(order.passenger_id);
          if (passengerUser) {
            this.createTodo(
              passengerUser.id, 'passenger', order.id,
              'rate_service', 'low'
            );
          }
        }
        break;
    }
  },

  getStatusName(status) {
    const statusMap = {
      'pending': '待派单',
      'driver_assigned': '已派单待司机接单',
      'driver_accepted': '司机已接单',
      'in_progress': '行程进行中',
      'arrived': '已到达',
      'payment_completed': '已支付',
      'completed': '已完成',
      'cancelled': '已取消',
      'exception': '异常'
    };
    return statusMap[status] || status;
  },

  getTodoCount(userId, status = 'pending') {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM todos 
      WHERE user_id = ? AND status = ?
    `).get(userId, status);
    return result.count;
  },

  getUnreadNotificationCount(userId) {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(userId);
    return result.count;
  },

  markNotificationAsRead(notificationId) {
    db.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE id = ?
    `).run(notificationId);
  }
};

module.exports = StateSyncService;
