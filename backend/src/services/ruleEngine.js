const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../config/database');
const { logOperation, transition, ACTIONS, getTicketById } = require('./stateMachine');

const RULE_TYPES = {
  METRIC: 'metric',
  LOG: 'log',
  ALERT: 'alert'
};

const CONDITIONS = {
  GT: '>',
  GTE: '>=',
  LT: '<',
  LTE: '<=',
  EQ: '==',
  NEQ: '!=',
  CONTAINS: 'contains',
  MATCHES: 'matches'
};

const evaluateCondition = (value, condition, threshold) => {
  const numValue = parseFloat(value);
  const numThreshold = parseFloat(threshold);
  
  switch (condition) {
    case '>':
      return !isNaN(numValue) && !isNaN(numThreshold) && numValue > numThreshold;
    case '>=':
      return !isNaN(numValue) && !isNaN(numThreshold) && numValue >= numThreshold;
    case '<':
      return !isNaN(numValue) && !isNaN(numThreshold) && numValue < numThreshold;
    case '<=':
      return !isNaN(numValue) && !isNaN(numThreshold) && numValue <= numThreshold;
    case '==':
      return value == threshold;
    case '!=':
      return value != threshold;
    case 'contains':
      return typeof value === 'string' && value.includes(threshold);
    case 'matches':
      try {
        const regex = new RegExp(threshold);
        return regex.test(String(value));
      } catch {
        return false;
      }
    default:
      return false;
  }
};

const generateEventKey = (rule, metricValue) => {
  const baseKey = `${rule.id}-${rule.metric_name}-${rule.condition}`;
  const timestamp = Math.floor(Date.now() / (rule.dedup_window || 300) / 1000);
  return `${baseKey}-${timestamp}`;
};

const checkDeduplication = (rule, metricValue, ticketId) => {
  if (!rule.is_dedup) return { shouldAlert: true, dedupCount: 0 };
  
  const eventKey = generateEventKey(rule, metricValue);
  
  const existing = query(
    `SELECT * FROM alert_events 
     WHERE alert_rule_id = ? AND event_key = ? AND status = 'firing'`,
    [rule.id, eventKey]
  );
  
  if (existing.length > 0) {
    const event = existing[0];
    run(
      `UPDATE alert_events 
       SET last_triggered_at = datetime('now'), dedup_count = dedup_count + 1
       WHERE id = ?`,
      [event.id]
    );
    return { shouldAlert: false, dedupCount: event.dedup_count + 1, existingEvent: event };
  }
  
  return { shouldAlert: true, dedupCount: 0 };
};

const createAlertRule = (data, userId) => {
  const code = data.code || `RULE-${Date.now()}`;
  
  const result = run(
    `INSERT INTO alert_rules 
     (name, code, description, rule_type, metric_name, condition, threshold, 
      duration, severity, status, is_dedup, dedup_window, dedup_key, 
      version, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))`,
    [
      data.name,
      code,
      data.description,
      data.rule_type || RULE_TYPES.METRIC,
      data.metric_name,
      data.condition,
      data.threshold,
      data.duration || 0,
      data.severity || 'warning',
      data.is_dedup ? 1 : 0,
      data.dedup_window || 300,
      data.dedup_key,
      userId
    ]
  );
  
  const ruleId = result.lastInsertRowid;
  logOperation(userId, 'rule', 'create', ruleId, null, data);
  
  return query('SELECT * FROM alert_rules WHERE id = ?', [ruleId])[0];
};

const updateAlertRule = (ruleId, data, userId) => {
  const existing = query('SELECT * FROM alert_rules WHERE id = ?', [ruleId])[0];
  if (!existing) throw new Error('规则不存在');
  
  const newVersion = (existing.version || 1) + 1;
  
  run(
    `UPDATE alert_rules 
     SET name = ?, description = ?, metric_name = ?, condition = ?, threshold = ?,
         duration = ?, severity = ?, status = ?, is_dedup = ?, dedup_window = ?,
         dedup_key = ?, version = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [
      data.name || existing.name,
      data.description !== undefined ? data.description : existing.description,
      data.metric_name !== undefined ? data.metric_name : existing.metric_name,
      data.condition || existing.condition,
      data.threshold !== undefined ? data.threshold : existing.threshold,
      data.duration !== undefined ? data.duration : existing.duration,
      data.severity || existing.severity,
      data.status !== undefined ? data.status : existing.status,
      data.is_dedup !== undefined ? (data.is_dedup ? 1 : 0) : existing.is_dedup,
      data.dedup_window !== undefined ? data.dedup_window : existing.dedup_window,
      data.dedup_key !== undefined ? data.dedup_key : existing.dedup_key,
      newVersion,
      ruleId
    ]
  );
  
  logOperation(userId, 'rule', 'update', ruleId, existing, data);
  
  return query('SELECT * FROM alert_rules WHERE id = ?', [ruleId])[0];
};

const evaluateMetricRule = (rule, metrics, ticketId, userId) => {
  if (rule.status !== 1) return { triggered: false, message: '规则未启用' };
  
  const relevantMetrics = metrics.filter(m => 
    m.name === rule.metric_name || m.code === rule.metric_name
  );
  
  if (relevantMetrics.length === 0) {
    return { triggered: false, message: '未找到相关指标' };
  }
  
  const results = [];
  
  for (const metric of relevantMetrics) {
    const value = metric.value;
    const triggered = evaluateCondition(value, rule.condition, rule.threshold);
    
    if (triggered) {
      const dedupResult = checkDeduplication(rule, value, ticketId);
      
      if (dedupResult.shouldAlert) {
        const eventKey = generateEventKey(rule, value);
        
        const eventResult = run(
          `INSERT INTO alert_events 
           (alert_rule_id, ticket_id, event_key, title, description, severity, 
            status, metric_value, threshold, first_triggered_at, last_triggered_at)
           VALUES (?, ?, ?, ?, ?, ?, 'firing', ?, ?, datetime('now'), datetime('now'))`,
          [
            rule.id,
            ticketId,
            eventKey,
            `${rule.name} 告警`,
            `指标 ${rule.metric_name} 值为 ${value}，${rule.condition} ${rule.threshold}`,
            rule.severity,
            value,
            rule.threshold
          ]
        );
        
        results.push({
          triggered: true,
          eventId: eventResult.lastInsertRowid,
          metric,
          value,
          threshold: rule.threshold,
          isNew: true
        });
      } else {
        results.push({
          triggered: true,
          eventId: dedupResult.existingEvent.id,
          metric,
          value,
          threshold: rule.threshold,
          isNew: false,
          dedupCount: dedupResult.dedupCount
        });
      }
    } else {
      results.push({
        triggered: false,
        metric,
        value,
        threshold: rule.threshold
      });
    }
  }
  
  const anyTriggered = results.some(r => r.triggered);
  
  if (anyTriggered && ticketId) {
    const ticket = getTicketById(ticketId);
    if (ticket && ticket.current_node === 'rules') {
      try {
        transition(ticketId, ACTIONS.APPROVE, userId, '规则检查通过，进入告警阶段');
      } catch (e) {
        console.log('状态流转失败:', e.message);
      }
    }
  }
  
  return {
    triggered: anyTriggered,
    results,
    rule
  };
};

const evaluateAllRulesForMetric = (metrics, ticketId, userId) => {
  const activeRules = query('SELECT * FROM alert_rules WHERE status = 1');
  
  const results = [];
  for (const rule of activeRules) {
    const result = evaluateMetricRule(rule, metrics, ticketId, userId);
    results.push(result);
  }
  
  return {
    anyTriggered: results.some(r => r.triggered),
    results
  };
};

const resolveAlertEvent = (eventId, userId, comment) => {
  const event = query('SELECT * FROM alert_events WHERE id = ?', [eventId])[0];
  if (!event) throw new Error('告警事件不存在');
  
  run(
    `UPDATE alert_events 
     SET status = 'resolved', resolved_at = datetime('now')
     WHERE id = ?`,
    [eventId]
  );
  
  if (event.ticket_id) {
    const ticket = getTicketById(event.ticket_id);
    if (ticket && ticket.current_node === 'alert') {
      try {
        transition(event.ticket_id, ACTIONS.APPROVE, userId, comment || '告警已解决，进入通知阶段');
      } catch (e) {
        console.log('状态流转失败:', e.message);
      }
    }
  }
  
  logOperation(userId, 'alert', 'resolve', eventId, { status: event.status }, { status: 'resolved' });
  
  return query('SELECT * FROM alert_events WHERE id = ?', [eventId])[0];
};

const getDashboardStats = (userId) => {
  const totalTickets = query('SELECT COUNT(*) as count FROM tickets')[0]?.count || 0;
  
  const statusBreakdown = query(
    `SELECT status, COUNT(*) as count FROM tickets GROUP BY status`
  );
  
  const activeAlerts = query(
    `SELECT COUNT(*) as count FROM alert_events WHERE status = 'firing'`
  )[0]?.count || 0;
  
  const pendingMessages = query(
    `SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND status = 'unread'`,
    [userId]
  )[0]?.count || 0;
  
  const nodeDistribution = query(
    `SELECT current_node, COUNT(*) as count FROM tickets GROUP BY current_node`
  );
  
  const recentTickets = query(
    `SELECT t.*, u.name as reporter_name 
     FROM tickets t 
     LEFT JOIN users u ON t.reporter_id = u.id 
     ORDER BY t.created_at DESC LIMIT 10`
  );
  
  const recentAlerts = query(
    `SELECT ae.*, ar.name as rule_name 
     FROM alert_events ae 
     LEFT JOIN alert_rules ar ON ae.alert_rule_id = ar.id 
     ORDER BY ae.last_triggered_at DESC LIMIT 10`
  );
  
  return {
    totalTickets,
    statusBreakdown: statusBreakdown.map(s => ({ status: s.status, count: s.count })),
    activeAlerts,
    pendingMessages,
    nodeDistribution: nodeDistribution.map(n => ({ node: n.current_node, count: n.count })),
    recentTickets,
    recentAlerts
  };
};

module.exports = {
  RULE_TYPES,
  CONDITIONS,
  evaluateCondition,
  createAlertRule,
  updateAlertRule,
  evaluateMetricRule,
  evaluateAllRulesForMetric,
  resolveAlertEvent,
  getDashboardStats,
  checkDeduplication
};
