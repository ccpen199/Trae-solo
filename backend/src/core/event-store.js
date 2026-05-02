import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

const EventTypes = {
  RISK_ASSESSMENT_SUBMITTED: 'RiskAssessmentSubmitted',
  RISK_ASSESSMENT_COMPLETED: 'RiskAssessmentCompleted',
  RISK_ASSESSMENT_FAILED: 'RiskAssessmentFailed',
  
  PURCHASE_SUBMITTED: 'PurchaseSubmitted',
  PAYMENT_CONFIRMED: 'PaymentConfirmed',
  PURCHASE_LOCKED: 'PurchaseLocked',
  SHARE_CALCULATED: 'ShareCalculated',
  PURCHASE_COMPLETED: 'PurchaseCompleted',
  PURCHASE_FAILED: 'PurchaseFailed',
  
  REDEMPTION_SUBMITTED: 'RedemptionSubmitted',
  REDEMPTION_CONFIRMED: 'RedemptionConfirmed',
  FUND_CLEARED: 'FundCleared',
  REDEMPTION_COMPLETED: 'RedemptionCompleted',
  REDEMPTION_FAILED: 'RedemptionFailed',
  
  DIVIDEND_EVENT_RECEIVED: 'DividendEventReceived',
  DIVIDEND_PROCESSED: 'DividendProcessed',
  DIVIDEND_COMPLETED: 'DividendCompleted',
  
  COMPLIANCE_ALERT_RAISED: 'ComplianceAlertRaised',
  COMPLIANCE_ALERT_RESOLVED: 'ComplianceAlertResolved',
  RECONCILIATION_COMPLETED: 'ReconciliationCompleted',
  
  ORDER_REJECTED: 'OrderRejected',
  ORDER_RETRIED: 'OrderRetried',
  ORDER_CLOSED: 'OrderClosed',
  
  USER_CREATED: 'UserCreated',
  USER_UPDATED: 'UserUpdated',
  
  ASSET_UPDATED: 'AssetUpdated',
  TRANSACTION_CREATED: 'TransactionCreated',
  
  NAV_UPDATED: 'NavUpdated',
};

const AggregateTypes = {
  USER: 'User',
  ORDER: 'Order',
  ASSET: 'Asset',
  DIVIDEND: 'Dividend',
  PRODUCT: 'Product',
  ASSESSMENT: 'Assessment',
  RECONCILIATION: 'Reconciliation',
  ALERT: 'Alert',
};

class EventStore {
  append(aggregateType, aggregateId, eventType, payload, metadata = {}) {
    const eventId = uuidv4();
    const now = new Date().toISOString();
    
    metadata.occurredAt = now;
    
    const stmt = db.prepare(`
      INSERT INTO events (id, aggregate_type, aggregate_id, event_type, event_version, payload, metadata, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      eventId,
      aggregateType,
      aggregateId,
      eventType,
      1,
      JSON.stringify(payload),
      JSON.stringify(metadata),
      now
    );
    
    return {
      id: eventId,
      aggregateType,
      aggregateId,
      eventType,
      payload,
      metadata,
      occurredAt: now
    };
  }

  getByAggregate(aggregateType, aggregateId) {
    const stmt = db.prepare(`
      SELECT * FROM events WHERE aggregate_type = ? AND aggregate_id = ? ORDER BY occurred_at ASC
    `);
    
    const rows = stmt.all(aggregateType, aggregateId);
    
    return rows.map(row => ({
      ...row,
      payload: JSON.parse(row.payload),
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }));
  }

  getByEventType(eventType, limit = 100) {
    const stmt = db.prepare(`
      SELECT * FROM events WHERE event_type = ? ORDER BY occurred_at DESC LIMIT ?
    `);
    
    const rows = stmt.all(eventType, limit);
    
    return rows.map(row => ({
      ...row,
      payload: JSON.parse(row.payload),
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }));
  }

  query(filters = {}, limit = 100, offset = 0) {
    let sql = `SELECT * FROM events WHERE 1=1`;
    const params = [];
    
    if (filters.aggregateType) {
      sql += ` AND aggregate_type = ?`;
      params.push(filters.aggregateType);
    }
    if (filters.aggregateId) {
      sql += ` AND aggregate_id = ?`;
      params.push(filters.aggregateId);
    }
    if (filters.eventType) {
      sql += ` AND event_type = ?`;
      params.push(filters.eventType);
    }
    if (filters.startDate) {
      sql += ` AND occurred_at >= ?`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += ` AND occurred_at <= ?`;
      params.push(filters.endDate);
    }
    
    sql += ` ORDER BY occurred_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    
    return rows.map(row => ({
      ...row,
      payload: JSON.parse(row.payload),
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }));
  }

  getAuditTrail(aggregateType, aggregateId) {
    const events = this.getByAggregate(aggregateType, aggregateId);
    return events.map(event => ({
      eventId: event.id,
      eventType: event.event_type,
      occurredAt: event.occurred_at,
      payload: event.payload,
      metadata: event.metadata
    }));
  }

  replayEvents(aggregateType, aggregateId, initialState = {}) {
    const events = this.getByAggregate(aggregateType, aggregateId);
    let state = { ...initialState };
    
    for (const event of events) {
      state = this.applyEvent(state, event);
    }
    
    return state;
  }

  applyEvent(state, event) {
    const { event_type: eventType, payload } = event;
    
    switch (eventType) {
      case EventTypes.RISK_ASSESSMENT_SUBMITTED:
        return { ...state, assessmentStatus: 'submitted', ...payload };
      case EventTypes.RISK_ASSESSMENT_COMPLETED:
        return { ...state, assessmentStatus: 'completed', riskLevel: payload.riskLevel, score: payload.score };
      case EventTypes.RISK_ASSESSMENT_FAILED:
        return { ...state, assessmentStatus: 'failed', failureReason: payload.reason };
      
      case EventTypes.PURCHASE_SUBMITTED:
      case EventTypes.REDEMPTION_SUBMITTED:
        return { ...state, status: 'submitted', ...payload };
      case EventTypes.PAYMENT_CONFIRMED:
        return { ...state, paymentStatus: 'confirmed', confirmedAt: payload.confirmedAt };
      case EventTypes.PURCHASE_LOCKED:
        return { ...state, status: 'locked', lockedAt: payload.lockedAt };
      case EventTypes.SHARE_CALCULATED:
        return { ...state, shares: payload.shares, nav: payload.nav };
      case EventTypes.PURCHASE_COMPLETED:
      case EventTypes.REDEMPTION_COMPLETED:
        return { ...state, status: 'completed', completedAt: payload.completedAt };
      case EventTypes.PURCHASE_FAILED:
      case EventTypes.REDEMPTION_FAILED:
        return { ...state, status: 'failed', failureReason: payload.reason };
      
      case EventTypes.ORDER_REJECTED:
        return { ...state, status: 'rejected', rejectedAt: payload.rejectedAt, rejectedReason: payload.reason };
      case EventTypes.ORDER_RETRIED:
        return { ...state, status: 'retried', retryCount: (state.retryCount || 0) + 1 };
      case EventTypes.ORDER_CLOSED:
        return { ...state, status: 'closed', closedAt: payload.closedAt };
      
      default:
        return { ...state, ...payload };
    }
  }
}

export default new EventStore();
export { EventTypes, AggregateTypes };
