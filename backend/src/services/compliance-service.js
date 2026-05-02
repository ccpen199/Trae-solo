import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import eventStore, { EventTypes, AggregateTypes } from '../core/event-store.js';
import clearingDistributionEngine from '../engines/clearing-distribution-engine.js';

class ComplianceService {
  checkPurchaseRedemptionRatio() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const stmt = db.prepare(`
      SELECT order_type, COUNT(*) as count, SUM(amount) as total_amount
      FROM orders 
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY order_type
    `);
    const rows = stmt.all(startOfDay, endOfDay);

    const purchases = rows.find(r => r.order_type === 'purchase') || { count: 0, total_amount: 0 };
    const redemptions = rows.find(r => r.order_type === 'redemption') || { count: 0, total_amount: 0 };
    
    const ratio = redemptions.total_amount > 0 
      ? purchases.total_amount / redemptions.total_amount 
      : purchases.total_amount > 0 ? Infinity : 1;

    if (ratio < 0.5 || ratio > 2) {
      this.createAlert(
        'purchase_redemption_ratio',
        'high',
        '申赎比异常',
        `当前申赎比为 ${ratio.toFixed(2)}，超出正常范围 [0.5, 2.0]`,
        null, null, null,
        1.0,
        ratio
      );
    }

    return {
      purchaseCount: purchases.count,
      purchaseAmount: purchases.total_amount,
      redemptionCount: redemptions.count,
      redemptionAmount: redemptions.total_amount,
      ratio,
      ratioStatus: ratio >= 0.5 && ratio <= 2 ? 'normal' : 'alert'
    };
  }

  checkPositionConcentration() {
    const stmt = db.prepare(`
      SELECT 
         u.id as user_id,
         u.username,
         ua.product_id,
         fp.name as product_name,
         ua.total_shares,
         fp.nav,
         ua.total_shares * fp.nav as market_value,
         (ua.total_shares * fp.nav) / (
           SELECT SUM(ua2.total_shares * fp2.nav)
           FROM user_assets ua2
           LEFT JOIN fund_products fp2 ON ua2.product_id = fp2.id
           WHERE ua2.user_id = u.id
         ) as concentration_ratio
       FROM user_assets ua
       LEFT JOIN users u ON ua.user_id = u.id
       LEFT JOIN fund_products fp ON ua.product_id = fp.id
       WHERE ua.total_shares > 0
       HAVING concentration_ratio > 0.7
    `);
    const rows = stmt.all();

    for (const row of rows) {
      this.createAlert(
        'position_concentration',
        'medium',
        '持仓集中度过高',
        `用户 ${row.username} 在产品 ${row.product_name} 中的持仓占比达到 ${(row.concentration_ratio * 100).toFixed(2)}%`,
        row.user_id,
        null,
        row.product_id,
        0.7,
        row.concentration_ratio
      );
    }

    return {
      highConcentrationPositions: rows,
      alertCount: rows.length
    };
  }

  createAlert(alertType, severity, title, description, relatedUserId, relatedOrderId, relatedProductId, thresholdValue, actualValue) {
    const now = new Date().toISOString();
    const alertId = uuidv4();

    eventStore.append(
      AggregateTypes.ALERT,
      alertId,
      EventTypes.COMPLIANCE_ALERT_RAISED,
      {
        alertType,
        severity,
        title,
        description,
        relatedUserId,
        relatedOrderId,
        relatedProductId,
        thresholdValue,
        actualValue,
        detectedAt: now
      },
      { source: 'ComplianceService' }
    );

    const stmt = db.prepare(`
      INSERT INTO compliance_alerts (
         id, alert_type, severity, title, description,
         related_user_id, related_order_id, related_product_id,
         threshold_value, actual_value, status, detected_at, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      alertId, alertType, severity, title, description,
      relatedUserId, relatedOrderId, relatedProductId,
      thresholdValue, actualValue, 'open', now, now
    );

    return {
      id: alertId,
      alertType,
      severity,
      title,
      description,
      status: 'open',
      detectedAt: now
    };
  }

  resolveAlert(alertId, resolverId, resolutionNotes) {
    const now = new Date().toISOString();

    eventStore.append(
      AggregateTypes.ALERT,
      alertId,
      EventTypes.COMPLIANCE_ALERT_RESOLVED,
      {
        alertId,
        resolverId,
        resolutionNotes,
        resolvedAt: now
      },
      { source: 'ComplianceService' }
    );

    const stmt = db.prepare(`
      UPDATE compliance_alerts SET
         status = ?,
         resolved_at = ?,
         resolver_id = ?,
         resolution_notes = ?
       WHERE id = ?
    `);
    stmt.run('resolved', now, resolverId, resolutionNotes, alertId);

    return {
      alertId,
      status: 'resolved',
      resolvedAt: now,
      resolverId,
      resolutionNotes
    };
  }

  getAlerts(filters = {}) {
    let sql = `SELECT ca.*, 
                       u.username as related_user_name,
                       fp.name as product_name
                FROM compliance_alerts ca
                LEFT JOIN users u ON ca.related_user_id = u.id
                LEFT JOIN fund_products fp ON ca.related_product_id = fp.id
                WHERE 1=1`;
    const params = [];

    if (filters.status) {
      sql += ` AND ca.status = ?`;
      params.push(filters.status);
    }
    if (filters.severity) {
      sql += ` AND ca.severity = ?`;
      params.push(filters.severity);
    }
    if (filters.alert_type) {
      sql += ` AND ca.alert_type = ?`;
      params.push(filters.alert_type);
    }

    sql += ` ORDER BY ca.detected_at DESC`;

    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }

  runDailyReconciliation(reconciliationDate) {
    const result = clearingDistributionEngine.reconcileOrders(reconciliationDate);
    
    const now = new Date().toISOString();
    const reconId = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO reconciliations (
         id, reconciliation_date, type, status,
         total_orders, matched_orders, unmatched_orders,
         difference_amount, report_data, created_at, completed_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      reconId, result.date, 'daily', 'completed',
      result.totalOrders, result.matchedOrders, result.unmatchedOrders,
      result.differenceAmount, JSON.stringify(result), now, now
    );

    return {
      ...result,
      id: reconId,
      completedAt: now
    };
  }

  getReconciliations(filters = {}) {
    let sql = `SELECT * FROM reconciliations WHERE 1=1`;
    const params = [];

    if (filters.start_date) {
      sql += ` AND reconciliation_date >= ?`;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      sql += ` AND reconciliation_date <= ?`;
      params.push(filters.end_date);
    }

    sql += ` ORDER BY reconciliation_date DESC`;

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);

    return rows.map(r => ({
      ...r,
      reportData: r.report_data ? JSON.parse(r.report_data) : null
    }));
  }

  getAuditTrail(aggregateType, aggregateId) {
    return eventStore.getAuditTrail(aggregateType, aggregateId);
  }

  getAllEvents(filters = {}, limit = 100, offset = 0) {
    return eventStore.query(filters, limit, offset);
  }
}

export default new ComplianceService();
