const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');

class AuditLogger {
  static log(action, resourceType, resourceId, details, user, req = null, status = 'success', errorMessage = null) {
    const auditId = uuidv4();
    
    const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
    const userAgent = req?.headers?.['user-agent'] || null;

    db.prepare(`
      INSERT INTO audit_logs (
        id, user_id, username, role, action, resource_type, resource_id,
        details, ip_address, user_agent, status, error_message, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId,
      user?.id || null,
      user?.username || null,
      user?.role || null,
      action,
      resourceType,
      resourceId,
      details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
      status,
      errorMessage,
      Date.now()
    );

    return auditId;
  }

  static query(filters = {}) {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }

    if (filters.resourceType) {
      query += ' AND resource_type = ?';
      params.push(filters.resourceType);
    }

    if (filters.startTime) {
      query += ' AND timestamp >= ?';
      params.push(filters.startTime);
    }

    if (filters.endTime) {
      query += ' AND timestamp <= ?';
      params.push(filters.endTime);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return db.prepare(query).all(...params);
  }

  static getOrderFullPath(orderId) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    
    if (!order) {
      return null;
    }

    const statusHistory = db.prepare(`
      SELECT * FROM order_status_history 
      WHERE order_id = ? 
      ORDER BY timestamp
    `).all(orderId);

    const riskLogs = db.prepare(`
      SELECT * FROM risk_check_logs 
      WHERE order_id = ? 
      ORDER BY timestamp
    `).all(orderId);

    const trades = db.prepare(`
      SELECT * FROM trades 
      WHERE order_id = ? 
      ORDER BY created_at
    `).all(orderId);

    const auditLogs = db.prepare(`
      SELECT * FROM audit_logs 
      WHERE resource_type = 'order' AND resource_id = ? 
      ORDER BY timestamp
    `).all(orderId);

    return {
      order,
      statusHistory,
      riskLogs,
      trades,
      auditLogs,
      events: this.compileEvents(order, statusHistory, riskLogs, trades, auditLogs)
    };
  }

  static compileEvents(order, statusHistory, riskLogs, trades, auditLogs) {
    const events = [];

    events.push({
      type: 'ORDER_CREATED',
      timestamp: order.created_at,
      description: '订单创建',
      details: {
        orderNo: order.order_no,
        securityCode: order.security_code,
        direction: order.direction,
        price: order.price,
        quantity: order.quantity
      }
    });

    for (const history of statusHistory) {
      events.push({
        type: 'STATE_CHANGE',
        timestamp: history.timestamp,
        description: `状态变更: ${history.from_state} -> ${history.to_status}`,
        details: {
          fromState: history.from_state,
          toState: history.to_status,
          reason: history.reason,
          operator: history.operator_name
        }
      });
    }

    for (const risk of riskLogs) {
      events.push({
        type: 'RISK_CHECK',
        timestamp: risk.timestamp,
        description: `风控检查: ${risk.check_result}`,
        details: {
          checkType: risk.check_type,
          result: risk.check_result,
          message: risk.check_message
        }
      });
    }

    for (const trade of trades) {
      events.push({
        type: 'TRADE_EXECUTED',
        timestamp: trade.created_at,
        description: `成交: ${trade.quantity}股 @ ${trade.price}元`,
        details: {
          tradeNo: trade.trade_no,
          price: trade.price,
          quantity: trade.quantity,
          amount: trade.amount,
          commission: trade.commission,
          stampTax: trade.stamp_tax
        }
      });
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }
}

module.exports = AuditLogger;
