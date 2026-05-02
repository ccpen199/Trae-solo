const { v4: uuidv4 } = require('uuid');
const { db } = require('./database');
const moment = require('moment');

class OrderStateMachine {
  static STATES = {
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    ACCEPTED: 'accepted',
    PARTIALLY_FILLED: 'partially_filled',
    FILLED: 'filled',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected'
  };

  static TRANSITIONS = {
    [this.STATES.PENDING]: [this.STATES.SUBMITTED, this.STATES.CANCELLED],
    [this.STATES.SUBMITTED]: [this.STATES.ACCEPTED, this.STATES.REJECTED],
    [this.STATES.ACCEPTED]: [this.STATES.PARTIALLY_FILLED, this.STATES.FILLED, this.STATES.CANCELLED],
    [this.STATES.PARTIALLY_FILLED]: [this.STATES.FILLED, this.STATES.CANCELLED],
    [this.STATES.FILLED]: [],
    [this.STATES.CANCELLED]: [],
    [this.STATES.REJECTED]: []
  };

  static canTransition(from, to) {
    const allowed = this.TRANSITIONS[from] || [];
    return allowed.includes(to);
  }

  static transition(orderId, toState, reason = null, operator = null) {
    const order = db.prepare('SELECT id, status, user_id FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    if (!this.canTransition(order.status, toState)) {
      throw new Error(`不允许从 ${order.status} 状态转换到 ${toState} 状态`);
    }

    const now = Date.now();
    const historyId = uuidv4();

    db.prepare(`
      INSERT INTO order_status_history (id, order_id, from_status, to_status, reason, operator_id, operator_name, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(historyId, orderId, order.status, toState, reason, operator?.id, operator?.name, now);

    let updateFields = ['status = ?', 'updated_at = ?'];
    let params = [toState, now];

    if (toState === this.STATES.SUBMITTED) {
      updateFields.push('submitted_at = ?');
      params.push(now);
    } else if (toState === this.STATES.ACCEPTED) {
      updateFields.push('accepted_at = ?');
      params.push(now);
    } else if (toState === this.STATES.FILLED || toState === this.STATES.PARTIALLY_FILLED) {
      updateFields.push('matched_at = ?');
      params.push(now);
    } else if (toState === this.STATES.CANCELLED) {
      updateFields.push('cancelled_at = ?');
      params.push(now);
    } else if (toState === this.STATES.REJECTED) {
      updateFields.push('rejected_at = ?');
      params.push(now);
    }

    params.push(orderId);

    db.prepare(`UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`).run(...params);

    this.auditStateChange(order, order.status, toState, reason, operator);

    return true;
  }

  static auditStateChange(order, fromState, toState, reason, operator) {
    const auditId = uuidv4();
    const user = operator || db.prepare('SELECT username, role FROM users WHERE id = ?').get(order.user_id);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, username, role, action, resource_type, resource_id, details, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId,
      operator?.id || order.user_id,
      user?.username,
      user?.role,
      'ORDER_STATE_CHANGE',
      'order',
      order.id,
      JSON.stringify({
        from_state: fromState,
        to_state: toState,
        reason: reason
      }),
      'success',
      Date.now()
    );
  }
}

module.exports = OrderStateMachine;
